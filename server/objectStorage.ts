// Object storage: Replit (GCS sidecar) or S3/R2 based on OBJECT_STORAGE_PROVIDER
import * as Replit from "./objectStorageReplit.js";
import * as S3 from "./objectStorageS3.js";

const provider = process.env.OBJECT_STORAGE_PROVIDER || "replit";

export const ObjectStorageService = provider === "s3" ? S3.ObjectStorageService : Replit.ObjectStorageService;
export const ObjectNotFoundError = provider === "s3" ? S3.ObjectNotFoundError : Replit.ObjectNotFoundError;
export const objectStorageClient =
  provider === "s3" ? S3.objectStorageClient : Replit.objectStorageClient;
