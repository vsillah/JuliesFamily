import assert from "node:assert/strict";
import test from "node:test";
import {
  VANGUARD_PRIVATE_IGES_UPLOAD_LIMITS,
  validateVanguardPrivateIgesMetadata,
  validateVanguardStoredSource,
} from "../convex/orderUploadPolicy.ts";

const valid = {
  fileName: "Bracket 01.iges",
  mediaType: "application/iges",
  byteSize: 12_345,
  checksumSha256: "a".repeat(64),
};

test("accepts bounded IGES metadata and normalizes case", () => {
  assert.deepEqual(validateVanguardPrivateIgesMetadata({
    ...valid,
    mediaType: "APPLICATION/IGES",
    checksumSha256: "A".repeat(64),
  }), valid);
});

test("rejects unsafe names and non-IGES extensions", () => {
  assert.throws(() => validateVanguardPrivateIgesMetadata({ ...valid, fileName: "../part.iges" }));
  assert.throws(() => validateVanguardPrivateIgesMetadata({ ...valid, fileName: "part.step" }));
});

test("rejects empty, oversized, and fractional byte sizes", () => {
  assert.throws(() => validateVanguardPrivateIgesMetadata({ ...valid, byteSize: 0 }));
  assert.throws(() => validateVanguardPrivateIgesMetadata({
    ...valid,
    byteSize: VANGUARD_PRIVATE_IGES_UPLOAD_LIMITS.sourceBytes + 1,
  }));
  assert.throws(() => validateVanguardPrivateIgesMetadata({ ...valid, byteSize: 1.5 }));
});

test("rejects unsupported media types and malformed checksums", () => {
  assert.throws(() => validateVanguardPrivateIgesMetadata({ ...valid, mediaType: "text/html" }));
  assert.throws(() => validateVanguardPrivateIgesMetadata({ ...valid, checksumSha256: "not-a-digest" }));
});

test("accepts exact stored metadata and rejects size, type, or checksum drift", () => {
  assert.deepEqual(validateVanguardStoredSource(valid, {
    contentType: valid.mediaType,
    size: valid.byteSize,
    sha256: valid.checksumSha256,
  }), { ok: true });
  assert.deepEqual(validateVanguardStoredSource(valid, {
    contentType: valid.mediaType,
    size: valid.byteSize + 1,
    sha256: valid.checksumSha256,
  }), { ok: false, code: "stored_size_mismatch" });
  assert.deepEqual(validateVanguardStoredSource(valid, {
    contentType: "application/octet-stream",
    size: valid.byteSize,
    sha256: valid.checksumSha256,
  }), { ok: false, code: "stored_type_mismatch" });
  assert.deepEqual(validateVanguardStoredSource(valid, {
    contentType: valid.mediaType,
    size: valid.byteSize,
    sha256: "b".repeat(64),
  }), { ok: false, code: "stored_checksum_mismatch" });
});
