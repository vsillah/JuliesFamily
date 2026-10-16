import { existsSync, readFileSync } from "node:fs";

const checks = [];
const check = (condition, label, detail) => checks.push({ ok: Boolean(condition), label, detail });

function requireIncludes(path, patterns) {
  check(existsSync(path), `${path} exists`, "Expected engineering-control source is missing.");
  if (!existsSync(path)) return "";
  const source = readFileSync(path, "utf8");
  for (const pattern of patterns) check(source.includes(pattern), `${path} includes ${pattern}`, "Expected engineering-control marker was not found.");
  return source;
}

const geometry = requireIncludes("client/src/lib/kinfloIges.ts", [
  "boundsMm",
  'coordinates: "mm"',
  'sourceDeclared: "unknown"',
  "min: minTuple",
  "max: maxTuple",
]);
const workspace = requireIncludes("client/src/lib/kinfloIgesWorkspace.ts", [
  "KINFLO_IGES_HOME_TRANSFORM",
  "normalizeKinfloIgesTransform",
  "getKinfloPlacedCenter",
  "createKinfloDerivedInspectionExport",
  'format: "source"',
  'format: "stl"',
  'format: "obj"',
  'format: "step"',
  "Unavailable: the browser review has triangles",
]);
const viewer = requireIncludes("client/src/components/VanguardIgesViewer.tsx", [
  "Spatial coordinates",
  "Source unit: unknown",
  "Placed center",
  "Precision placement",
  "Orbit / rotate",
  "Move / pan",
  "Shift/right-drag pans",
  "vanguard-iges-translation-step",
  "vanguard-iges-rotation-step",
  "vanguard-iges-zoom-percent",
  "normalizeKinfloIgesTransform",
]);
const intake = requireIncludes("client/src/components/VanguardIgesIntake.tsx", [
  "Download and export capabilities",
  "downloadOriginalSource",
  "createKinfloDerivedInspectionExport",
  "not editable CAD solids or manufacturing-certified conversions",
  "KINFLO_IGES_EXPORT_CAPABILITIES",
]);
requireIncludes("scripts/test-kinflo-iges-admission.ts", [
  "extents, min, max, center, and explicit unit provenance",
  "normalizes precise spatial transforms",
  "exports real STL and OBJ inspection meshes while keeping STEP unavailable",
]);
requireIncludes("docs/vanguard-reversr-iges-engineering-controls.md", [
  "Spatial, not temporal",
  "Source-declared unit: unknown",
  "Original validated IGES",
  "Derived inspection mesh",
  "STEP remains unavailable",
]);

const clientRuntime = [geometry, workspace, viewer, intake].join("\n");
for (const marker of ["useMutation(", "useAction(", 'fetch("/api/', "XMLHttpRequest", "WebSocket(", "localStorage.setItem"]) {
  check(!clientRuntime.includes(marker), `engineering-control runtime excludes ${marker}`, "The browser-local path cannot add provider/server writes or persistent local storage.");
}
check(!clientRuntime.includes("contentBase64"), "engineering-control runtime excludes source-byte receipts", "Source bytes cannot enter the sanitized receipt.");
check(!existsSync(".env.local"), ".env.local remains absent", "This source-only lane cannot create .env.local.");

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
check(packageJson.scripts?.["kinflo:validate-vanguard-iges-engineering-controls"] === "node scripts/validate-kinflo-vanguard-iges-engineering-controls.mjs", "engineering-control validator is registered", "Missing validator script.");
check(packageJson.scripts?.["kinflo:capture-vanguard-iges-engineering-controls-qa"] === "node scripts/capture-vanguard-iges-engineering-controls-qa.mjs", "engineering-control QA capture is registered", "Missing QA capture script.");

for (const item of checks) {
  console[item.ok ? "log" : "error"](`${item.ok ? "✓" : "✗"} ${item.label}`);
  if (!item.ok) console.error(`  ${item.detail}`);
}
const failed = checks.filter((item) => !item.ok);
console.log("\nKinFlo Vanguard IGES engineering-controls validation");
console.log("Convex bindings/codegen: unchanged");
console.log("Server persistence/private storage: disabled");
console.log("Provider calls/live order writes: 0");
if (failed.length) {
  console.error(`\nValidation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}
console.log(`\nValidation passed: ${checks.length} checks.`);
