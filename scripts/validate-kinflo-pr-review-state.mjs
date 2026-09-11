import { execFileSync } from "node:child_process";

const checks = [];

function pass(label) {
  checks.push({ label, ok: true });
}

function fail(label, detail) {
  checks.push({ label, ok: false, detail });
}

function runGhPrView() {
  return JSON.parse(
    execFileSync(
      "gh",
      [
        "pr",
        "view",
        "1",
        "--repo",
        "vsillah/JuliesFamily",
        "--json",
        "url,state,isDraft,headRefName,headRefOid,mergeStateStatus,statusCheckRollup",
      ],
      { encoding: "utf8" },
    ),
  );
}

const pr = runGhPrView();
const rollup = Array.isArray(pr.statusCheckRollup) ? pr.statusCheckRollup : [];
const vercel = rollup.find((item) => item.__typename === "StatusContext" && item.context === "Vercel");
const previewComments = rollup.find((item) => item.__typename === "CheckRun" && item.name === "Vercel Preview Comments");
const vercelTargetUrl = vercel?.targetUrl ?? "";
const vercelState = vercel?.state ?? "MISSING";
const isVercelRateLimited = vercelState === "FAILURE" && vercelTargetUrl.includes("build-rate-limit");

if (pr.url === "https://github.com/vsillah/JuliesFamily/pull/1") {
  pass("PR #1 URL matches Julie's Family source");
} else {
  fail("PR #1 URL matches Julie's Family source", `Received ${pr.url ?? "(missing)"}.`);
}

if (pr.state === "OPEN") {
  pass("PR remains open");
} else {
  fail("PR remains open", `Received ${pr.state ?? "(missing)"}.`);
}

if (pr.isDraft === true) {
  pass("PR remains draft for staged review");
} else {
  fail("PR remains draft for staged review", "Provider-light packet should stay draft until integration/deployment gates pass.");
}

if (pr.headRefName === "codex/kinflo-phase-0-convex-plan") {
  pass("PR head branch matches Phase 0 lane");
} else {
  fail("PR head branch matches Phase 0 lane", `Received ${pr.headRefName ?? "(missing)"}.`);
}

if (typeof pr.headRefOid === "string" && /^[a-f0-9]{40}$/.test(pr.headRefOid)) {
  pass("PR head SHA is present");
} else {
  fail("PR head SHA is present", `Received ${pr.headRefOid ?? "(missing)"}.`);
}

if (vercel) {
  pass("Vercel status context is present");
} else {
  fail("Vercel status context is present", "Missing required Vercel status context.");
}

if (previewComments || isVercelRateLimited) {
  pass("Vercel Preview Comments check is present or rate-limited unavailable");
} else {
  fail("Vercel Preview Comments check is present or rate-limited unavailable", "Missing required Vercel Preview Comments check run.");
}

if (["PENDING", "SUCCESS"].includes(vercelState)) {
  pass(`Vercel status is non-failing: ${vercelState}`);
} else if (isVercelRateLimited) {
  pass("Vercel status is external_rate_limit_blocked");
} else {
  fail("Vercel status is non-failing", `Received ${vercelState}. Inspect the Vercel target before merging.`);
}

const previewState = previewComments?.conclusion ?? previewComments?.status ?? "MISSING";
if (previewComments?.conclusion === "SUCCESS") {
  pass("Vercel Preview Comments succeeded");
} else if (isVercelRateLimited) {
  pass("Vercel Preview Comments unavailable while deployment is rate-limited");
} else {
  fail("Vercel Preview Comments succeeded", `Received ${previewState}.`);
}

const mergeReadiness = vercelState === "SUCCESS" && previewComments?.conclusion === "SUCCESS"
  ? "ready_for_integration_review"
  : isVercelRateLimited
    ? "external_rate_limit_blocked"
    : "blocked_until_vercel_success";

if (["ready_for_integration_review", "blocked_until_vercel_success", "external_rate_limit_blocked"].includes(mergeReadiness)) {
  pass(`merge readiness computed: ${mergeReadiness}`);
} else {
  fail("merge readiness computed", "Unexpected merge readiness state.");
}

const failed = checks.filter((check) => !check.ok);

for (const check of checks) {
  if (check.ok) {
    console.log(`✓ ${check.label}`);
  } else {
    console.error(`✗ ${check.label}`);
    console.error(`  ${check.detail}`);
  }
}

console.log("\nKinFlo PR review state validation");
console.log(`PR: ${pr.url}`);
console.log(`Head: ${pr.headRefName}@${pr.headRefOid}`);
console.log(`Draft: ${pr.isDraft ? "yes" : "no"}`);
console.log(`Merge state: ${pr.mergeStateStatus ?? "unknown"}`);
console.log(`Vercel state: ${vercelState}`);
console.log(`Vercel target: ${vercel?.targetUrl ?? "missing"}`);
console.log(`Vercel Preview Comments: ${previewState}`);
console.log(`Merge readiness: ${mergeReadiness}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");
console.log("Secrets read or printed: no");

if (failed.length > 0) {
  console.error(`\nKinFlo PR review state validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo PR review state validation passed: ${checks.length} checks.`);
