import assert from "node:assert/strict";
import test from "node:test";
import {
  KINFLO_IGES_LIMITS,
  KinfloIgesError,
  createKinfloEngineeringReview,
  inspectKinfloIgesSource,
  normalizeKinfloIgesGeometry,
} from "../client/src/lib/kinfloIges.ts";
import { createVanguardLocalReceipt, parseVanguardLocalReceipt } from "../client/src/lib/kinfloVanguardOrderPortal.ts";
import {
  KINFLO_IGES_EXPORT_CAPABILITIES,
  createKinfloDerivedInspectionExport,
  getKinfloPlacedCenter,
  normalizeKinfloIgesTransform,
} from "../client/src/lib/kinfloIgesWorkspace.ts";

const encoder = new TextEncoder();

function row(payload: string, section: "S" | "G" | "D" | "P" | "T", sequence: number) {
  return `${payload.padEnd(72, " ").slice(0, 72)}${section}${String(sequence).padStart(7, " ")}`;
}

function source(directoryEntity = 128) {
  return encoder.encode([
    row("KINFL0 BOUNDED IGES TEST", "S", 1),
    row("1H,,1H;,TEST", "G", 1),
    row(String(directoryEntity).padStart(8, " "), "D", 1),
    row(String(directoryEntity).padStart(8, " "), "D", 2),
    row("128,1,0,0,0,0,0,0;", "P", 1),
    row("S      1G      1D      2P      1", "T", 1),
  ].join("\n"));
}

function expectCode(expectedCode: string, action: () => unknown) {
  assert.throws(action, (error) => error instanceof KinfloIgesError && error.code === expectedCode);
}

test("admits strict 80-column standalone IGES source", () => {
  assert.doesNotThrow(() => inspectKinfloIgesSource("Bracket 01.igs", source()));
});

test("rejects unsafe filenames and non-IGES extensions", () => {
  expectCode("MALFORMED", () => inspectKinfloIgesSource("../part.igs", source()));
  expectCode("UNSUPPORTED", () => inspectKinfloIgesSource("part.step", source()));
});

test("rejects oversized, non-ASCII, malformed, and external-reference sources", () => {
  expectCode("TOO_LARGE", () => inspectKinfloIgesSource("part.igs", new Uint8Array(KINFLO_IGES_LIMITS.sourceBytes + 1).fill(32)));
  const nonAscii = source();
  nonAscii[0] = 255;
  expectCode("MALFORMED", () => inspectKinfloIgesSource("part.igs", nonAscii));
  expectCode("MALFORMED", () => inspectKinfloIgesSource("part.igs", encoder.encode("not an IGES record")));
  expectCode("UNSUPPORTED", () => inspectKinfloIgesSource("part.igs", source(416)));
});

test("normalizes triangle geometry with extents, min, max, center, and explicit unit provenance", () => {
  const geometry = normalizeKinfloIgesGeometry({
    success: true,
    meshes: [{
      attributes: { position: { array: [-5, 2, 10, 5, 2, 10, -5, 22, 15] } },
      index: { array: [0, 1, 2] },
    }],
  });
  assert.deepEqual(geometry.boundingBoxMm, [10, 20, 5]);
  assert.deepEqual(geometry.boundsMm, { min: [-5, 2, 10], max: [5, 22, 15], center: [0, 12, 12.5] });
  assert.deepEqual(geometry.units, { coordinates: "mm", sourceDeclared: "unknown" });
  assert.equal(geometry.meshCount, 1);
  assert.equal(geometry.vertexCount, 3);
  assert.equal(geometry.triangleCount, 1);
});

test("normalizes precise spatial transforms and reports the placed center", () => {
  const normalized = normalizeKinfloIgesTransform({
    translationMm: { x: 12.5, y: Number.NaN, z: 2_000_000 },
    rotationDeg: { x: -450, y: 45, z: 999 },
    zoomPercent: 900,
  });
  assert.deepEqual(normalized, {
    translationMm: { x: 12.5, y: 0, z: 1_000_000 },
    rotationDeg: { x: -360, y: 45, z: 360 },
    zoomPercent: 400,
  });
  assert.deepEqual(getKinfloPlacedCenter(normalized), { x: 12.5, y: 0, z: 1_000_000 });
});

test("exports real STL and OBJ inspection meshes while keeping STEP unavailable", () => {
  const geometry = normalizeKinfloIgesGeometry({
    success: true,
    meshes: [{ attributes: { position: { array: [0, 0, 0, 10, 0, 0, 0, 10, 5] } }, index: { array: [0, 1, 2] } }],
  });
  const stl = createKinfloDerivedInspectionExport(geometry, "Bracket.iges", "stl");
  const obj = createKinfloDerivedInspectionExport(geometry, "Bracket.iges", "obj");
  assert.equal(stl.fileName, "Bracket-inspection-mesh-mm.stl");
  assert.match(stl.content, /facet normal/);
  assert.match(stl.content, /vertex 10 0 0/);
  assert.equal(obj.fileName, "Bracket-inspection-mesh-mm.obj");
  assert.match(obj.content, /v 0 10 5/);
  assert.match(obj.content, /f 1 2 3/);
  assert.equal(KINFLO_IGES_EXPORT_CAPABILITIES.find((item) => item.format === "step")?.available, false);
});

test("rejects no-geometry and mesh-count overflow results", () => {
  expectCode("NO_GEOMETRY", () => normalizeKinfloIgesGeometry({ success: true, meshes: [] }));
  const mesh = { attributes: { position: { array: [0, 0, 0, 1, 0, 0, 0, 1, 1] } }, index: { array: [0, 1, 2] } };
  expectCode("OUTPUT_LIMIT", () => normalizeKinfloIgesGeometry({ success: true, meshes: Array.from({ length: 17 }, () => mesh) }));
});

test("creates deterministic sanitized engineering-review receipts", () => {
  const geometry = normalizeKinfloIgesGeometry({
    success: true,
    meshes: [{ attributes: { position: { array: [0, 0, 0, 10, 0, 0, 0, 10, 10] } }, index: { array: [0, 1, 2] } }],
  });
  const digest = "a".repeat(64);
  const receipt = createKinfloEngineeringReview("Bracket.iges", 1234, digest, geometry);
  assert.equal(receipt.receiptId, "VE-IGES-AAAAAAAAAAAA");
  assert.equal(receipt.status, "engineering_review_only");
  assert.equal(JSON.stringify(receipt).includes("positions"), false);
  assert.equal(JSON.stringify(receipt).includes("indices"), false);
});

test("receipt parser strips legacy absence and rejects tampered engineering summaries", () => {
  const geometry = normalizeKinfloIgesGeometry({
    success: true,
    meshes: [{ attributes: { position: { array: [0, 0, 0, 10, 0, 0, 0, 10, 10] } }, index: { array: [0, 1, 2] } }],
  });
  const engineeringReview = createKinfloEngineeringReview("Bracket.iges", 1234, "b".repeat(64), geometry);
  const receipt = createVanguardLocalReceipt({
    sourcePackage: ["CAD or 3D model"],
    goal: "Review this bounded IGES geometry.",
    discipline: "Rebuild engineering",
    constraints: ["Fit, tolerance, or critical dimensions"],
    engineeringReview,
  });
  assert.deepEqual(parseVanguardLocalReceipt(JSON.stringify(receipt))?.engineeringReview, engineeringReview);
  assert.equal(parseVanguardLocalReceipt(JSON.stringify({ ...receipt, engineeringReview: { ...engineeringReview, positions: [1, 2, 3] } })), null);
  assert.equal(parseVanguardLocalReceipt(JSON.stringify({ ...receipt, engineeringReview: { ...engineeringReview, receiptId: "VE-IGES-TAMPERED" } })), null);
  const { engineeringReview: _removed, ...legacyReceipt } = receipt;
  assert.equal(parseVanguardLocalReceipt(JSON.stringify(legacyReceipt))?.engineeringReview, null);
});
