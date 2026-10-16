export const KINFLO_IGES_LIMITS = Object.freeze({
  sourceBytes: 256 * 1024,
  outputBytes: 1024 * 1024,
  meshes: 16,
  vertices: 20_000,
  triangles: 10_000,
  timeoutMs: 5_000,
});

export type KinfloIgesErrorCode =
  | "NO_SOURCE"
  | "MALFORMED"
  | "UNSUPPORTED"
  | "TOO_LARGE"
  | "NO_GEOMETRY"
  | "INVALID_GEOMETRY"
  | "OUTPUT_LIMIT"
  | "CONVERSION_FAILED"
  | "RUNTIME_UNAVAILABLE"
  | "TIMEOUT";

export type KinfloIgesMesh = {
  positions: number[];
  indices: number[];
};

export type KinfloIgesGeometry = {
  meshes: KinfloIgesMesh[];
  meshCount: number;
  vertexCount: number;
  triangleCount: number;
  boundingBoxMm: [number, number, number];
  boundsMm: {
    min: [number, number, number];
    max: [number, number, number];
    center: [number, number, number];
  };
  units: {
    coordinates: "mm";
    sourceDeclared: "unknown";
  };
};

export type KinfloEngineeringReview = {
  schemaVersion: 1;
  status: "engineering_review_only";
  fileName: string;
  sourceBytes: number;
  meshCount: number;
  vertexCount: number;
  triangleCount: number;
  boundingBoxMm: [number, number, number];
  digestSha256: string;
  receiptId: string;
};

export class KinfloIgesError extends Error {
  readonly code: KinfloIgesErrorCode;

  constructor(code: KinfloIgesErrorCode, message: string) {
    super(message);
    this.name = "KinfloIgesError";
    this.code = code;
  }
}

function reject(code: KinfloIgesErrorCode, message: string): never {
  throw new KinfloIgesError(code, message);
}

export function inspectKinfloIgesFileName(fileName: string) {
  if (
    typeof fileName !== "string"
    || fileName.length > 120
    || !/^[A-Za-z0-9][A-Za-z0-9 _().-]*$/.test(fileName)
    || fileName.includes("..")
  ) {
    reject("MALFORMED", "Use an ASCII-safe filename up to 120 characters without path-like segments.");
  }
  if (!/\.(igs|iges)$/i.test(fileName)) {
    reject("UNSUPPORTED", "Only standalone .igs and .iges files are accepted.");
  }
}

export function inspectKinfloIgesSource(fileName: string, bytes: Uint8Array) {
  inspectKinfloIgesFileName(fileName);
  if (!(bytes instanceof Uint8Array)) reject("MALFORMED", "The selected file could not be read as bytes.");
  if (!bytes.byteLength) reject("NO_SOURCE", "Choose a nonempty IGES file.");
  if (bytes.byteLength > KINFLO_IGES_LIMITS.sourceBytes) {
    reject("TOO_LARGE", "The selected file exceeds the 256 KiB browser-review limit.");
  }
  if (bytes.some((value) => value > 126 || (value < 32 && value !== 10 && value !== 13))) {
    reject("MALFORMED", "The IGES source must contain ASCII text records only.");
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    reject("MALFORMED", "The IGES source is not valid UTF-8 compatible ASCII text.");
  }

  const rows = text.trimEnd().split(/\r?\n/);
  const sections = rows.map((row) => row[72]).join("");
  if (
    rows.some((row) => row.length !== 80 || !/^[SGDPT][ 0-9]{7}$/.test(row.slice(72)))
    || !/^S+G+D+P+T$/.test(sections)
  ) {
    reject("MALFORMED", "The file must use ordered, strict 80-column IGES records.");
  }

  const directoryRows = rows.filter((row) => row[72] === "D");
  if (directoryRows.length % 2) reject("MALFORMED", "The IGES directory section has an incomplete entity pair.");
  for (let index = 0; index < directoryRows.length; index += 2) {
    if (Number(directoryRows[index].slice(0, 8)) === 416) {
      reject("UNSUPPORTED", "IGES external-reference entities are not accepted.");
    }
  }
}

function safeNumberArray(value: unknown): number[] {
  if (!value || typeof (value as ArrayLike<unknown>).length !== "number") return [];
  return Array.from(value as ArrayLike<unknown>, Number);
}

export function normalizeKinfloIgesGeometry(result: unknown): KinfloIgesGeometry {
  const candidate = result as { success?: boolean; meshes?: Array<{ attributes?: { position?: { array?: unknown } }; index?: { array?: unknown } }> };
  if (!candidate?.success) reject("CONVERSION_FAILED", "The IGES source could not be converted.");
  if (!Array.isArray(candidate.meshes) || !candidate.meshes.length) {
    reject("NO_GEOMETRY", "No triangle geometry was found in this IGES file.");
  }
  if (candidate.meshes.length > KINFLO_IGES_LIMITS.meshes) {
    reject("OUTPUT_LIMIT", "The model exceeds the 16-mesh browser-review limit.");
  }

  let vertexCount = 0;
  let triangleCount = 0;
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  const meshes = candidate.meshes.map((mesh) => {
    const positions = safeNumberArray(mesh?.attributes?.position?.array);
    const indices = safeNumberArray(mesh?.index?.array).map((value) => Math.trunc(value));
    if (!positions.length || !indices.length || positions.length % 3 || indices.length % 3) {
      reject("INVALID_GEOMETRY", "The converted model contains incomplete triangle geometry.");
    }

    const meshVertices = positions.length / 3;
    vertexCount += meshVertices;
    triangleCount += indices.length / 3;
    if (vertexCount > KINFLO_IGES_LIMITS.vertices || triangleCount > KINFLO_IGES_LIMITS.triangles) {
      reject("OUTPUT_LIMIT", "The model exceeds the 20,000-vertex or 10,000-triangle browser-review limit.");
    }
    if (!indices.every((value) => Number.isInteger(value) && value >= 0 && value < meshVertices)) {
      reject("INVALID_GEOMETRY", "The converted model contains invalid triangle indices.");
    }
    for (let offset = 0; offset < positions.length; offset += 3) {
      const point = positions.slice(offset, offset + 3);
      if (!point.every((value) => Number.isFinite(value) && Math.abs(value) <= 1e9)) {
        reject("INVALID_GEOMETRY", "The converted model contains invalid coordinates.");
      }
      for (let axis = 0; axis < 3; axis += 1) {
        min[axis] = Math.min(min[axis], point[axis]);
        max[axis] = Math.max(max[axis], point[axis]);
      }
    }
    return { positions, indices };
  });

  const boundingBoxMm = max.map((value, axis) => value - min[axis]) as [number, number, number];
  if (!boundingBoxMm.every((value) => Number.isFinite(value) && value > 0)) {
    reject("INVALID_GEOMETRY", "The converted model has invalid millimeter bounds.");
  }

  const minTuple = min as [number, number, number];
  const maxTuple = max as [number, number, number];
  const center = min.map((value, axis) => value + boundingBoxMm[axis] / 2) as [number, number, number];
  const geometry: KinfloIgesGeometry = {
    meshes,
    meshCount: meshes.length,
    vertexCount,
    triangleCount,
    boundingBoxMm,
    boundsMm: { min: minTuple, max: maxTuple, center },
    units: { coordinates: "mm", sourceDeclared: "unknown" },
  };
  if (new TextEncoder().encode(JSON.stringify(geometry)).byteLength > KINFLO_IGES_LIMITS.outputBytes) {
    reject("OUTPUT_LIMIT", "The converted geometry exceeds the 1 MiB browser-review output limit.");
  }
  return geometry;
}

export async function sha256Hex(bytes: Uint8Array) {
  if (!globalThis.crypto?.subtle) reject("RUNTIME_UNAVAILABLE", "This browser cannot create the local review digest.");
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

export function createKinfloEngineeringReview(
  fileName: string,
  sourceBytes: number,
  digestSha256: string,
  geometry: KinfloIgesGeometry,
): KinfloEngineeringReview {
  inspectKinfloIgesFileName(fileName);
  if (!/^[a-f0-9]{64}$/.test(digestSha256)) reject("MALFORMED", "The local review digest is invalid.");
  return Object.freeze({
    schemaVersion: 1,
    status: "engineering_review_only",
    fileName,
    sourceBytes,
    meshCount: geometry.meshCount,
    vertexCount: geometry.vertexCount,
    triangleCount: geometry.triangleCount,
    boundingBoxMm: geometry.boundingBoxMm.map((value) => Number(value.toFixed(3))) as [number, number, number],
    digestSha256,
    receiptId: `VE-IGES-${digestSha256.slice(0, 12).toUpperCase()}`,
  });
}

export function asKinfloIgesError(error: unknown) {
  return error instanceof KinfloIgesError
    ? error
    : new KinfloIgesError("CONVERSION_FAILED", "The IGES source could not be converted for browser review.");
}
