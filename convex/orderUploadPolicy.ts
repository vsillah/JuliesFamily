export const VANGUARD_PRIVATE_IGES_UPLOAD_LIMITS = {
  sourceBytes: 256 * 1024,
  fileNameBytes: 160,
  checksumHexCharacters: 64,
} as const;

export const VANGUARD_PRIVATE_IGES_MEDIA_TYPES = [
  "application/iges",
  "application/octet-stream",
  "model/iges",
] as const;

export type VanguardPrivateIgesMetadata = {
  fileName: string;
  mediaType: string;
  byteSize: number;
  checksumSha256: string;
};

export type VanguardStoredSourceMetadata = {
  contentType?: string;
  size: number;
  sha256: string;
};

export type VanguardStoredSourceValidation =
  | { ok: true }
  | { ok: false; code: "stored_size_mismatch" | "stored_type_mismatch" | "stored_checksum_mismatch" };

function normalizedMediaType(value: string) {
  return value.trim().toLowerCase() || "application/octet-stream";
}

export function validateVanguardPrivateIgesMetadata(
  metadata: VanguardPrivateIgesMetadata,
): VanguardPrivateIgesMetadata {
  const fileName = metadata.fileName.trim();
  const fileNameBytes = new TextEncoder().encode(fileName).byteLength;
  if (
    !fileName
    || fileNameBytes > VANGUARD_PRIVATE_IGES_UPLOAD_LIMITS.fileNameBytes
    || !/^[A-Za-z0-9][A-Za-z0-9 _().-]*$/u.test(fileName)
  ) {
    throw new Error("IGES filename is invalid");
  }
  if (!/\.(igs|iges)$/iu.test(fileName)) {
    throw new Error("Private source must use the .igs or .iges extension");
  }
  if (
    !Number.isSafeInteger(metadata.byteSize)
    || metadata.byteSize < 1
    || metadata.byteSize > VANGUARD_PRIVATE_IGES_UPLOAD_LIMITS.sourceBytes
  ) {
    throw new Error(
      `Private source must be between 1 and ${VANGUARD_PRIVATE_IGES_UPLOAD_LIMITS.sourceBytes} bytes`,
    );
  }
  const mediaType = normalizedMediaType(metadata.mediaType);
  if (!(VANGUARD_PRIVATE_IGES_MEDIA_TYPES as readonly string[]).includes(mediaType)) {
    throw new Error("Private source media type is not allowed");
  }
  const checksumSha256 = metadata.checksumSha256.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/u.test(checksumSha256)) {
    throw new Error("Private source SHA-256 checksum is invalid");
  }
  return { fileName, mediaType, byteSize: metadata.byteSize, checksumSha256 };
}

export function validateVanguardStoredSource(
  declared: VanguardPrivateIgesMetadata,
  stored: VanguardStoredSourceMetadata,
): VanguardStoredSourceValidation {
  if (stored.size !== declared.byteSize) {
    return { ok: false, code: "stored_size_mismatch" };
  }
  const storedType = normalizedMediaType(stored.contentType ?? "application/octet-stream");
  if (storedType !== declared.mediaType) {
    return { ok: false, code: "stored_type_mismatch" };
  }
  if (stored.sha256.trim().toLowerCase() !== declared.checksumSha256) {
    return { ok: false, code: "stored_checksum_mismatch" };
  }
  return { ok: true };
}
