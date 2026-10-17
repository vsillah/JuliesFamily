import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const workflowPath = ".github/workflows/deploy-convex-development.yml";
const docPath = "docs/phase180-development-convex-remote-deployment.md";
const checks = [];

function check(label, condition, detail) {
  checks.push({ label, condition, detail });
}

function read(path) {
  return readFileSync(path, "utf8");
}

check("workflow exists", existsSync(workflowPath), `Missing ${workflowPath}.`);
check("handoff document exists", existsSync(docPath), `Missing ${docPath}.`);

const workflow = existsSync(workflowPath) ? read(workflowPath) : "";
const doc = existsSync(docPath) ? read(docPath) : "";
const pkg = JSON.parse(read("package.json"));
const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

check(
  "manual dispatch is the only trigger",
  workflow.includes("on:\n  workflow_dispatch:") &&
    !/[\n ](?:push|pull_request|schedule|workflow_run):/.test(workflow),
  "The deployment workflow must be manual-only.",
);
check(
  "typed confirmation is fixed to the development deployment",
  workflow.includes('Type "deploy hallowed-manatee-765"') &&
    workflow.includes('"deploy $EXPECTED_CONVEX_DEPLOYMENT"'),
  "Require the exact fixed-target confirmation phrase.",
);
check(
  "repository permissions are read-only",
  workflow.includes("permissions:\n  contents: read"),
  "Keep the workflow token at contents: read.",
);
check(
  "protected development environment is fixed",
  workflow.includes("environment: kinflo-convex-development"),
  "Use only the protected KinFlo development environment.",
);
check(
  "deployment target is fixed",
  workflow.includes("EXPECTED_CONVEX_DEPLOYMENT: hallowed-manatee-765"),
  "The workflow must not accept an operator-selected deployment.",
);
check(
  "deploy key comes from the protected secret",
  workflow.includes("CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}"),
  "Use the non-interactive GitHub environment secret.",
);
check(
  "deploy key binding must match the dev target",
  workflow.includes('"dev:$EXPECTED_CONVEX_DEPLOYMENT"') &&
    workflow.includes('deploy_key_binding="${CONVEX_DEPLOY_KEY%%|*}"'),
  "Reject any key not bound to dev:hallowed-manatee-765.",
);
check(
  "Convex dev push is single attempt",
  workflow.split("npx --no-install convex dev --once").length === 2 &&
    !workflow.includes("--until-success"),
  "Use one fail-closed Convex development push without retry.",
);
check(
  "typecheck and quiet log settings are explicit",
  workflow.includes("--typecheck enable") && workflow.includes("--tail-logs disable"),
  "Typecheck functions and disable hosted log tailing.",
);
check(
  "production selectors are absent",
  !workflow.includes("convex deploy") &&
    !workflow.includes("--prod") &&
    !/^\s+CONVEX_DEPLOYMENT:/m.test(workflow),
  "The development workflow must not contain production or preview selectors.",
);
check(
  "operator cannot choose a deployment",
  !workflow.includes("target_deployment") && !workflow.includes("deployment_name"),
  "Only the typed confirmation input is allowed; the target is code-fixed.",
);
check(
  "environment file is guarded before and after deployment",
  workflow.split("if [[ -e .env.local ]]").length === 3 && workflow.includes("unset CONVEX_DEPLOYMENT"),
  "Reject .env.local and clear ambient CONVEX_DEPLOYMENT selection.",
);
check(
  "workflow never writes an environment file",
  !/touch .*\.env\.local|>+\s*\.env\.local|--save-env|--env-file/.test(workflow),
  "Never create, append, or pass an environment file.",
);
check(
  "raw Convex output is withheld and removed",
  workflow.includes('>"$deploy_log" 2>&1') &&
    workflow.includes("Raw CLI output was withheld") &&
    workflow.includes("trap 'rm -f \"$deploy_log\"' EXIT"),
  "Capture ephemeral CLI output without publishing or retaining it.",
);
check(
  "CLI failure classification is coarse and allowlisted",
  [
    "authentication_or_authorization",
    "source_validation_or_codegen",
    "network_or_service_availability",
    "configuration_or_deployment_binding",
    "unclassified_cli_failure",
    "not_available_before_cli_attempt",
  ].every((classification) => workflow.includes(classification)) &&
    workflow.includes('echo "CONVEX_FAILURE_CLASSIFICATION=$failure_classification" >> "$GITHUB_ENV"') &&
    workflow.includes('*) failure_classification="unclassified_cli_failure" ;;'),
  "Classify a failed CLI attempt using only fixed coarse labels.",
);
check(
  "failure classification never publishes captured CLI content",
  !/cat\s+[^\n]*deploy_log/.test(workflow) &&
    !/echo\s+[^\n]*(?:deploy_log|\$\([^\n]*grep)/.test(workflow) &&
    !/GITHUB_(?:STEP_SUMMARY|OUTPUT|ENV)[^\n]*(?:grep|sed|awk|tail|head)[^\n]*deploy_log/.test(workflow),
  "Never copy raw or extracted Convex CLI output into annotations, outputs, environment values, or summaries.",
);
check(
  "secret is never echoed",
  !/echo[^\n]*(?:\$CONVEX_DEPLOY_KEY|\$\{CONVEX_DEPLOY_KEY)/.test(workflow) &&
    !/GITHUB_STEP_SUMMARY[^\n]*(?:\$CONVEX_DEPLOY_KEY|\$\{CONVEX_DEPLOY_KEY)/.test(workflow),
  "Never print or summarize secret material.",
);
check(
  "sanitized success evidence is complete",
  [
    "Commit:",
    "Workflow run:",
    "Deployment binding:",
    "Status:",
    "Production selectable:",
    "Secret values printed:",
    ".env.local",
  ].every((marker) => workflow.includes(marker)),
  "Report only the approved receipt fields.",
);
check(
  "sanitized failure evidence stops without retry",
  workflow.includes("failed; no retry attempted") &&
    workflow.includes("Failure classification:") &&
    workflow.includes("Raw CLI output printed:") &&
    workflow.includes("if: ${{ failure() }}"),
  "A failure must leave a clear, sanitized stop receipt.",
);
check(
  "actions are commit-pinned",
  /actions\/checkout@[0-9a-f]{40}/.test(workflow) &&
    /actions\/setup-node@[0-9a-f]{40}/.test(workflow),
  "Pin third-party actions to immutable commits.",
);
check(
  "document prescribes deployment-only key permission",
  doc.includes("Grant only `deployment:deploy`") &&
    doc.includes("dev:hallowed-manatee-765|") &&
    doc.includes("Stop before this gate"),
  "Document the narrow credential gate without provisioning it.",
);
check(
  "document preserves hard exclusions",
  [
    "production deployment",
    "hosted smoke",
    "adapter switching",
    "provider calls or writes",
    "data imports, mutations, or deletions",
    "site creation",
    "order writes or uploads",
    "1Password item access or modification",
    "`.env.local` creation or use",
  ].every((marker) => doc.includes(marker)),
  "Preserve every requested development-lane exclusion.",
);
check(
  "package script exposes validator",
  pkg.scripts?.["kinflo:validate-development-convex-remote-deployment"] ===
    "node scripts/validate-kinflo-development-convex-remote-deployment.mjs",
  "Expose the focused validator through package.json.",
);
check(
  "no local secret file exists or is tracked",
  !existsSync(".env.local") &&
    !tracked.some((path) => path === ".env.local" || path.endsWith(".local")),
  ".env.local and other local environment files must remain absent and untracked.",
);

const failed = checks.filter((item) => !item.condition);
console.log("KinFlo development Convex remote deployment validation");
for (const item of checks) {
  console.log(`${item.condition ? "✓" : "✗"} ${item.label}`);
  if (!item.condition) {
    console.log(`  ${item.detail}`);
  }
}

if (failed.length > 0) {
  console.error(`\nKinFlo development Convex remote deployment validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo development Convex remote deployment validation passed: ${checks.length} checks.`);
