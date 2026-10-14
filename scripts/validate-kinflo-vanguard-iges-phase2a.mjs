import { existsSync, readFileSync } from "node:fs";

const checks = [];
const check = (condition, label, detail) => checks.push({ ok: Boolean(condition), label, detail });

function requireIncludes(path, patterns) {
  check(existsSync(path), `${path} exists`, "Expected Phase 2A source is missing.");
  if (!existsSync(path)) return "";
  const source = readFileSync(path, "utf8");
  for (const pattern of patterns) check(source.includes(pattern), `${path} includes ${pattern}`, "Expected bounded CAD contract marker was not found.");
  return source;
}

const admission = requireIncludes("client/src/lib/kinfloIges.ts", [
  "sourceBytes: 256 * 1024",
  "outputBytes: 1024 * 1024",
  "meshes: 16",
  "vertices: 20_000",
  "triangles: 10_000",
  "/^[A-Za-z0-9][A-Za-z0-9 _().-]*$/",
  "/\\.(igs|iges)$/i",
  "row.length !== 80",
  "Number(directoryRows[index].slice(0, 8)) === 416",
  "engineering_review_only",
  "VE-IGES-",
]);
const browser = requireIncludes("client/src/lib/kinfloIgesBrowser.ts", [
  "new Worker(",
  "KINFLO_IGES_LIMITS.timeoutMs",
  "worker.terminate()",
  "inspectKinfloIgesSource",
  "sha256Hex",
]);
const worker = requireIncludes("client/src/workers/kinfloIges.worker.ts", [
  'from "occt-import-js"',
  'occt-import-js.wasm?url',
  "ReadIgesFile",
  'linearUnit: "millimeter"',
  'linearDeflectionType: "bounding_box_ratio"',
]);
const intake = requireIncludes("client/src/components/VanguardIgesIntake.tsx", [
  'type="file"',
  'accept=".igs,.iges"',
  'data-cad-state={state}',
  '"empty"',
  '"loading"',
  '"malformed"',
  '"unsupported"',
  '"too-large"',
  '"no-geometry"',
  '"ready"',
  "never uploaded, saved to Vanguard, or attached to the receipt",
  "Engineering review only",
  "not a quote, dimensional inspection, certification, or manufacturing guarantee",
]);
const viewer = requireIncludes("client/src/components/VanguardIgesViewer.tsx", [
  'import("three")',
  'OrbitControls.js',
  "new THREE.WebGLRenderer",
  'data-testid", "vanguard-iges-canvas"',
  "Orbit",
  "Fit",
  "Reset",
  "renderer.dispose()",
]);
const intakeHost = requireIncludes("client/src/components/VanguardReversRIntake.tsx", [
  "<VanguardIgesIntake",
  "engineeringReview",
  "CAD or 3D model",
]);
const receipt = requireIncludes("client/src/lib/kinfloVanguardOrderPortal.ts", [
  "engineeringReview: KinfloEngineeringReview | null",
  "function parseEngineeringReview",
  'candidate.status !== "engineering_review_only"',
  "candidate.receiptId !== `VE-IGES-",
]);
const portal = requireIncludes("client/src/pages/VanguardOrderPortal.tsx", [
  'data-testid="vanguard-order-engineering-review-summary"',
  "The source file and geometry are not attached.",
]);
requireIncludes("docs/vanguard-reversr-iges-phase2a.md", [
  "strict 80-column IGES records",
  "maximum 16 meshes",
  "maximum 20,000 vertices",
  "maximum 10,000 triangles",
  "maximum 1 MiB serialized geometry result",
  "engineering review only",
]);
requireIncludes("docs/qa/vanguard-iges-phase2a/README.md", [
  "1440 × 1000",
  "390 × 844",
  "External application requests: 0",
  "External writes: 0",
  "no-geometry branch is covered by the focused normalization test",
]);
for (const path of [
  "docs/qa/vanguard-iges-phase2a/01-desktop-empty.png",
  "docs/qa/vanguard-iges-phase2a/02-desktop-loading.png",
  "docs/qa/vanguard-iges-phase2a/03-desktop-ready.png",
  "docs/qa/vanguard-iges-phase2a/04-desktop-receipt-summary.png",
  "docs/qa/vanguard-iges-phase2a/05-desktop-malformed.png",
  "docs/qa/vanguard-iges-phase2a/06-desktop-unsupported.png",
  "docs/qa/vanguard-iges-phase2a/07-desktop-too-large.png",
  "docs/qa/vanguard-iges-phase2a/08-mobile-empty.png",
  "docs/qa/vanguard-iges-phase2a/09-mobile-ready.png",
  "docs/qa/vanguard-iges-phase2a/vanguard-iges-phase2a-walkthrough.mp4",
  "docs/qa/vanguard-iges-phase2a/network-evidence.json",
  "docs/qa/vanguard-iges-phase2a/video-evidence.json",
]) check(existsSync(path), `${path} exists`, "Expected privacy-safe Phase 2A evidence is missing.");
requireIncludes("scripts/test-kinflo-iges-admission.ts", [
  "rejects unsafe filenames and non-IGES extensions",
  "rejects oversized, non-ASCII, malformed, and external-reference sources",
  "creates deterministic sanitized engineering-review receipts",
]);

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
check(packageJson.dependencies?.["occt-import-js"] === "^0.0.23", "occt-import-js is pinned to the qualified package line", "Expected occt-import-js ^0.0.23.");
check(packageJson.dependencies?.three === "^0.184.0", "Three.js is pinned to the reviewed package line", "Expected three ^0.184.0.");
check(packageJson.scripts?.["kinflo:test-vanguard-iges-admission"], "focused IGES test command is registered", "Missing focused IGES tests.");
check(packageJson.scripts?.["kinflo:validate-vanguard-iges-phase2a"] === "node scripts/validate-kinflo-vanguard-iges-phase2a.mjs", "Phase 2A validator command is registered", "Missing Phase 2A validator command.");

const clientRuntime = [admission, browser, worker, intake, viewer, intakeHost, receipt, portal].join("\n");
for (const marker of ["useMutation(", "useAction(", 'fetch("/api/', "XMLHttpRequest", "WebSocket(", "localStorage.setItem"]) {
  check(!clientRuntime.includes(marker), `Phase 2A runtime excludes ${marker}`, "The bounded browser-local path cannot add provider/server writes or persistent local storage.");
}
check(!clientRuntime.includes("contentBase64"), "receipt/runtime excludes source bytes", "Source file bytes cannot enter the draft receipt.");
check(!clientRuntime.includes("sourceAssetUrl"), "receipt/runtime excludes source URLs", "The browser-local path cannot create a private asset URL.");
check(!existsSync(".env.local"), ".env.local remains absent", "This source-only lane cannot create .env.local.");

for (const item of checks) {
  console[item.ok ? "log" : "error"](`${item.ok ? "✓" : "✗"} ${item.label}`);
  if (!item.ok) console.error(`  ${item.detail}`);
}
const failed = checks.filter((item) => !item.ok);
console.log("\nKinFlo Vanguard IGES Phase 2A validation");
console.log("Server persistence: disabled");
console.log("Private uploads/storage: disabled");
console.log("Provider calls: 0");
console.log("Live order writes: 0");
if (failed.length) {
  console.error(`\nValidation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}
console.log(`\nValidation passed: ${checks.length} checks.`);
