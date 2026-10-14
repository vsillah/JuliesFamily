import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const check = (condition, label, detail) => checks.push({ ok: Boolean(condition), label, detail });

function readRequired(path) {
  check(existsSync(path), `${path} exists`, "Required triage artifact is missing.");
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

const admin = readRequired("client/src/pages/AdminKinfloShell.tsx");
const model = readRequired("client/src/lib/kinfloOrderOperationsWorkbench.ts");
const docs = readRequired("docs/vanguard-operations-triage-workbench.md");
const capture = readRequired("scripts/capture-vanguard-operations-load-balancing-qa.mjs");
const qaReadme = readRequired("docs/qa/vanguard-operations-load-balancing/README.md");
const packageJson = JSON.parse(readRequired("package.json"));

for (const marker of [
  "export type TenantOrderQueueRecord",
  "export type TenantOrderQueueFilters",
  "summarizeTenantOrderQueue",
  "getTenantOrderQueueOptions",
  "filterTenantOrderQueue",
  'filters.risk !== "all"',
  'filters.state !== "all"',
]) check(model.includes(marker), `tenant-neutral model includes ${marker}`, "The reusable queue contract is incomplete.");

for (const marker of [
  'data-testid="section-kinflo-vanguard-operations-filters"',
  'data-testid="kinflo-vanguard-operations-search"',
  'data-testid="kinflo-vanguard-operations-risk-filter"',
  'data-testid="kinflo-vanguard-operations-state-filter"',
  'data-testid="kinflo-vanguard-operations-clear-filters"',
  'data-testid="section-kinflo-vanguard-operations-empty"',
  'data-testid="section-kinflo-vanguard-selected-order-review"',
  "filteredOperationsQueue.length",
  "aria-live=\"polite\"",
  "aria-pressed={selectedOperationsQueueItem?.orderNumber === item.orderNumber}",
]) check(admin.includes(marker), `admin workbench includes ${marker}`, "The queue interaction or accessibility contract is incomplete.");

for (const marker of [
  "Reusable KinFlo capability",
  "External writes: 0.",
  "Live Convex reads or mutations: 0.",
  "Production deployment: not performed.",
  "Human QA",
]) check(docs.includes(marker), `triage record includes ${marker}`, "The review boundary is incomplete.");

for (const marker of [
  "vanguard-operations-load-balancing-walkthrough.mp4",
  "Search and filter interactions",
  "390px",
]) check(qaReadme.includes(marker), `QA README includes ${marker}`, "The QA packet does not describe the new interactions.");

for (const marker of [
  "kinflo-vanguard-operations-search",
  "kinflo-vanguard-review-order-ve-demo-1033",
  "section-kinflo-vanguard-selected-order-review",
  "Input.insertText",
]) check(capture.includes(marker), `capture script includes ${marker}`, "The visual QA script does not exercise the changed behavior.");

check(
  packageJson.scripts?.["kinflo:validate-vanguard-operations-triage"] === "node scripts/validate-kinflo-vanguard-operations-triage.mjs",
  "package registers the triage validator",
  "Expected the triage validation command.",
);

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);
check(!tracked.includes(".env.local") && !existsSync(".env.local"), ".env.local remains absent", "This lane cannot create or track .env.local.");
check(!tracked.some((path) => path.startsWith("convex/_generated/")), "generated Convex files remain untracked", "Codegen output is outside this lane.");

const runtime = `${admin}\n${model}`;
for (const marker of ['from "convex/_generated/api"', "useQuery(", "useMutation(", "useAction(", "fetch(\"/api/", "prepareUpload("]) {
  check(!runtime.includes(marker), `runtime excludes ${marker}`, "The triage slice must remain browser-only and provider-light.");
}

for (const result of checks) {
  if (result.ok) console.log(`✓ ${result.label}`);
  else {
    console.error(`✗ ${result.label}`);
    if (result.detail) console.error(`  ${result.detail}`);
  }
}

const failures = checks.filter((result) => !result.ok);
console.log("\nKinFlo Vanguard operations triage validation");
console.log("External writes: 0");
console.log("Convex codegen run: no");
console.log("Generated API import: no");
console.log("Production deployment: not performed");
if (failures.length) process.exit(1);
console.log(`\nKinFlo Vanguard operations triage validation passed: ${checks.length} checks.`);
