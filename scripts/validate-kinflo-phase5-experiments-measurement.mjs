import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const check = (label, condition) => checks.push({ label, condition });
const read = (path) => readFileSync(path, "utf8");
const experiment = read("client/src/lib/kinfloExperimentPreview.ts");
const measurement = read("client/src/lib/kinfloMeasurementContract.ts");
const admin = read("client/src/pages/AdminKinfloShell.tsx");
const publicPreview = read("client/src/pages/KinfloPublicSitePreview.tsx");
const publicResolver = read("client/src/lib/kinfloPublicSitePreview.ts");
const packageJson = JSON.parse(read("package.json"));
const changedFiles = execFileSync("git", ["diff", "--name-only", "origin/main...HEAD"], { encoding: "utf8" }).split("\n").filter(Boolean);

check("experiment contract exists", existsSync("client/src/lib/kinfloExperimentPreview.ts"));
check("measurement contract exists", existsSync("client/src/lib/kinfloMeasurementContract.ts"));
check("experiments carry tenant and site scope", experiment.includes("tenantSlug") && experiment.includes("siteSlug") && experiment.includes("resolveKinfloExperimentContract"));
check("deterministic preview allocation is explicit", experiment.includes("deterministic_preview_only") && experiment.includes("stableHash"));
check("scope and unknown selections fail closed", experiment.includes("do not match") && experiment.includes("unknown or inactive") && experiment.includes("outside this experiment scope"));
check("deep links carry read-only preview markers", experiment.includes('previewMode: "read_only"') && experiment.includes('experimentMode: "preview_only"') && experiment.includes('allocation: "deterministic_preview_only"'));
check("admin exposes experiment and variant controls", admin.includes("select-kinflo-preview-experiment") && admin.includes("select-kinflo-preview-experiment-variant") && admin.includes("buildKinfloAudiencePreviewHref") && admin.includes("previewExperimentResolution"));
check("public preview renders experiment state", publicPreview.includes("experimentVariant") && publicPreview.includes("previewBlocked") && publicPreview.includes("Deterministic selection only"));
check("public resolver carries experiment context", publicResolver.includes("resolveKinfloExperimentPreview") && publicResolver.includes("experiment: scopedExperiment"));
check("measurement is schema-only", measurement.includes('emission: "disabled"') && measurement.includes('persistence: "disabled"') && measurement.includes("emitted: false") && measurement.includes("persisted: false"));
check("Julie remains fixture-scoped", experiment.includes('"julies-family"') && experiment.includes("julie-program-path") && !experiment.includes("defaultExperiment"));
check("focused test script is registered", packageJson.scripts?.["kinflo:test-phase5-experiments-measurement"] === "node --import tsx --test scripts/test-kinflo-phase5-experiments-measurement.ts");
check("no Convex or environment files changed", !changedFiles.some((file) => file.startsWith("convex/") || file.includes(".env")));
check("no live emission or persistence APIs are referenced", ![experiment, measurement].some((source) => /fetch\(|useMutation|mutation\(|convex\/|\.env/i.test(source)));

for (const item of checks) {
  console.log(`${item.condition ? "✓" : "✗"} ${item.label}`);
}
const failed = checks.filter((item) => !item.condition);
if (failed.length) process.exit(1);
console.log(`\nKinFlo Phase 5 experimentation and measurement validation passed: ${checks.length} checks.`);
