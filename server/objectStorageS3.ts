// S3-compatible object storage (AWS S3 or Cloudflare R2) for non-Replit environments
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Response } from "express";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import type { ObjectAclPolicy, IStorageFile } from "./objectAcl";
import {
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

function getS3Config() {
  const bucket = process.env.S3_BUCKET || process.env.R2_BUCKET || process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucket) {
    throw new Error(
      "S3_BUCKET or R2_BUCKET or DEFAULT_OBJECT_STORAGE_BUCKET_ID must be set when OBJECT_STORAGE_PROVIDER=s3"
    );
  }
  const region = process.env.AWS_REGION || process.env.R2_REGION || "auto";
  const endpoint = process.env.R2_ACCOUNT_ID
    ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : undefined;
  const credentials =
    process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        }
      : undefined;
  return { bucket, region, endpoint, credentials };
}

let s3Client: S3Client | null = null;

function getClient(): S3Client {
  if (!s3Client) {
    const { region, endpoint, credentials } = getS3Config();
    s3Client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      credentials: credentials || undefined,
    });
  }
  return s3Client;
}

/** Path format: /bucket/key or /key. Always return configured bucket and key (no leading slash). */
function parsePath(path: string): { bucket: string; key: string } {
  const bucket = getS3Config().bucket;
  const p = path.startsWith("/") ? path.slice(1) : path;
  const key = p.startsWith(bucket + "/") ? p.slice(bucket.length + 1) : p;
  return { bucket, key };
}

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

class S3StorageFile implements IStorageFile {
  constructor(
    private client: S3Client,
    private bucket: string,
    private key: string
  ) {}

  get name(): string {
    return `${this.bucket}/${this.key}`;
  }

  async getMetadata(): Promise<[{ metadata?: Record<string, string>; contentType?: string; size?: number }]> {
    const cmd = new HeadObjectCommand({ Bucket: this.bucket, Key: this.key });
    const meta = await this.client.send(cmd);
    return [
      {
        metadata: (meta.Metadata as Record<string, string>) || {},
        contentType: meta.ContentType,
        size: meta.ContentLength,
      },
    ];
  }

  async setMetadata(arg: { metadata: Record<string, string> }): Promise<unknown> {
    const getCmd = new GetObjectCommand({ Bucket: this.bucket, Key: this.key });
    const obj = await this.client.send(getCmd);
    const body = obj.Body as Readable;
    const metadata = arg.metadata;
    const putCmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: this.key,
      Body: body,
      ContentType: obj.ContentType,
      Metadata: metadata,
    });
    return this.client.send(putCmd);
  }

  async exists(): Promise<[boolean]> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: this.key }));
      return [true];
    } catch {
      return [false];
    }
  }

  createReadStream(): Readable {
    const client = this.client;
    const bucket = this.bucket;
    const key = this.key;
    const readable = new Readable({ read: () => {} });
    (async () => {
      try {
        const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
        const res = await client.send(cmd);
        const stream = res.Body as Readable;
        stream.on("data", (chunk) => readable.push(chunk));
        stream.on("end", () => readable.push(null));
        stream.on("error", (err) => readable.destroy(err));
      } catch (err) {
        readable.destroy(err as Error);
      }
    })();
    return readable;
  }

  getBucket(): string {
    return this.bucket;
  }
  getKey(): string {
    return this.key;
  }

  async copy(dest: S3StorageFile): Promise<void> {
    await this.client.send(
      new CopyObjectCommand({
        CopySource: `${this.bucket}/${this.key}`,
        Bucket: dest.getBucket(),
        Key: dest.getKey(),
      })
    );
  }

  async delete(): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: this.key }));
  }
}

export class ObjectStorageService {
  private getBucket(): string {
    return getS3Config().bucket;
  }

  private normalizePath(path: string): string {
    if (path.startsWith("/")) return path;
    return `/${this.getBucket()}/${path}`;
  }

  getPublicObjectSearchPaths(): string[] {
    const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || process.env.S3_PUBLIC_PREFIXES || "";
    const paths = pathsStr
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => this.normalizePath(p));
    if (paths.length === 0) {
      throw new Error("PUBLIC_OBJECT_SEARCH_PATHS or S3_PUBLIC_PREFIXES must be set (comma-separated prefixes)");
    }
    return [...new Set(paths)];
  }

  getPrivateObjectDir(): string {
    const dir = process.env.PRIVATE_OBJECT_DIR || process.env.S3_PRIVATE_PREFIX || "";
    if (!dir) {
      throw new Error("PRIVATE_OBJECT_DIR or S3_PRIVATE_PREFIX must be set");
    }
    return this.normalizePath(dir);
  }

  async searchPublicObject(filePath: string): Promise<S3StorageFile | null> {
    const client = getClient();
    const bucket = this.getBucket();
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const { key } = parsePath(`${searchPath}/${filePath}`);
      const file = new S3StorageFile(client, bucket, key);
      const [exists] = await file.exists();
      if (exists) return file;
    }
    return null;
  }

  async downloadObject(
    file: S3StorageFile,
    res: Response,
    cacheTtlSec: number = 3600
  ): Promise<void> {
    try {
      const [metadata] = await file.getMetadata();
      const aclPolicy = await getObjectAclPolicy(file);
      const isPublic = aclPolicy?.visibility === "public";
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": String(metadata.size ?? 0),
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`,
      });
      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) res.status(500).json({ error: "Error streaming file" });
      });
      stream.pipe(res);
    } catch (err) {
      console.error("Error downloading file:", err);
      if (!res.headersSent) res.status(500).json({ error: "Error downloading file" });
    }
  }

  async getObjectEntityUploadURL(): Promise<{ uploadURL: string; objectPath: string }> {
    const client = getClient();
    const bucket = this.getBucket();
    const prefix = this.getPrivateObjectDir().replace(/^\//, "").replace(/^[^/]+\//, "") || "uploads";
    const objectId = randomUUID();
    const key = `${prefix}/uploads/${objectId}`;
    const uploadURL = await getSignedUrl(
      client,
      new PutObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: 900 }
    );
    return { uploadURL, objectPath: `/objects/uploads/${objectId}` };
  }

  async getObjectEntityFile(objectPath: string): Promise<S3StorageFile> {
    if (!objectPath.startsWith("/objects/")) throw new ObjectNotFoundError();
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) throw new ObjectNotFoundError();
    const entityId = parts.slice(1).join("/");
    const bucket = this.getBucket();
    const dirPrefix = this.getPrivateObjectDir().replace(/^\//, "").replace(/^[^/]+\//, "") || "";
    const key = dirPrefix ? `${dirPrefix}/${entityId}` : entityId;
    const client = getClient();
    const file = new S3StorageFile(client, bucket, key);
    const [exists] = await file.exists();
    if (!exists) throw new ObjectNotFoundError();
    return file;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (!rawPath.includes(".r2.cloudflarestorage.com") && !rawPath.includes("s3.")) {
      return rawPath;
    }
    try {
      const url = new URL(rawPath);
      const pathname = url.pathname.replace(/^\//, "");
      const entityDir = this.getPrivateObjectDir().replace(/^\//, "").split("/").slice(1).join("/");
      if (!pathname.startsWith(entityDir + "/")) return rawPath;
      const entityId = pathname.slice(entityDir.length + 1);
      return `/objects/${entityId}`;
    } catch {
      return rawPath;
    }
  }

  async setObjectEntityAclPolicy(objectPath: string, aclPolicy: ObjectAclPolicy): Promise<string> {
    const file = await this.getObjectEntityFile(objectPath);
    await setObjectAclPolicy(file, aclPolicy);
    return objectPath;
  }

  async trySetObjectEntityAclPolicy(rawPath: string, aclPolicy: ObjectAclPolicy): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) return normalizedPath;
    const file = await this.getObjectEntityFile(normalizedPath);
    await setObjectAclPolicy(file, aclPolicy);
    return normalizedPath;
  }

  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: IStorageFile;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }

  async renameObjectEntity(originalPath: string, newFilename: string): Promise<string> {
    const originalFile = await this.getObjectEntityFile(originalPath);
    const parts = originalPath.slice(1).split("/");
    const entityId = parts.slice(1).join("/");
    const directory = entityId.substring(0, entityId.lastIndexOf("/") + 1);
    const bucket = this.getBucket();
    const prefix = this.getPrivateObjectDir().replace(/^\//, "").replace(/^[^/]+\//, "") || "";
    const newKey = prefix ? `${prefix}/${directory}${newFilename}` : `${directory}${newFilename}`;
    const client = getClient();
    const newFile = new S3StorageFile(client, bucket, newKey);
    await originalFile.copy(newFile);
    const aclPolicy = await getObjectAclPolicy(originalFile);
    if (aclPolicy) await setObjectAclPolicy(newFile, aclPolicy);
    await originalFile.delete();
    return `/objects/${directory}${newFilename}`;
  }
}

export const objectStorageClient = null as unknown as import("@google-cloud/storage").Storage;
