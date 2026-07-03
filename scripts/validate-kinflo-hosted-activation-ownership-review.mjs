import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];

function pass(label) {
  checks.push({ label, ok: true });
}

function fail(label, detail) {
  checks.push({ label, ok: false, detail });
}

function read(path) {
  return readFileSync(path, "utf8");
}

function requireFile(path) {
  if (existsSync(path)) {
    pass(`${path} exists`);
    return true;
  }
  fail(`${path} exists`, "Expected hosted activation ownership review artifact was not found.");
  return false;
}

function requireIncludes(path, patterns) {
  if (!requireFile(path)) {
    return;
  }
  const contents = read(path);
  for (const pattern of patterns) {
    if (contents.includes(pattern)) {
      pass(`${path} includes ${pattern}`);
    } else {
      fail(`${path} includes ${pattern}`, "Expected hosted activation ownership review text was not found.");
    }
  }
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const trackedGenerated = tracked.filter((file) => file.startsWith("convex/_generated/"));
const trackedSecretFiles = tracked.filter((file) => [".env", ".env.local"].includes(file) || file.endsWith(".local"));

if (trackedGenerated.length > 0) {
  fail("generated Convex API files remain untracked", `Tracked generated files: ${trackedGenerated.join(", ")}`);
} else {
  pass("generated Convex API files remain untracked");
}

if (trackedSecretFiles.length > 0) {
  fail("secret env files remain untracked", `Tracked secret-like files: ${trackedSecretFiles.join(", ")}`);
} else {
  pass("secret env files remain untracked");
}

for (const path of [
  "docs/phase123-hosted-activation-ownership-review.md",
  "docs/phase49-hosted-activation-packet.md",
  "docs/phase73-hosted-activation-decision-register.md",
  "docs/phase85-hosted-activation-approval-packet.md",
  "docs/phase96-hosted-activation-owner-checklist.md",
  "docs/phase120-hosted-activation-decision-checkpoint.md",
  "docs/phase121-hosted-activation-credential-rotation-review.md",
  "docs/phase122-hosted-activation-repo-sharing-risk-review.md",
  "docs/kinflo-saas-execution-ledger.json",
  "docs/phase72-saas-execution-ledger.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-hosted-activation-ownership-review.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase123-hosted-activation-ownership-review.md", [
  "Phase 123: Hosted Activation Ownership Review",
  "npm run kinflo:validate-hosted-activation-ownership-review",
  "hostedActivationRunbook.hostedOwnershipReview",
  "ShellHostedActivationOwnershipReview",
  "hosted-convex-ownership",
  "section-kinflo-hosted-activation-ownership-review",
  "section-kinflo-hosted-activation-ownership-summary",
  "text-hosted-activation-ownership-next-gate",
  "section-kinflo-hosted-activation-ownership-criteria-scroll",
  "section-kinflo-hosted-activation-ownership-blocked-actions",
  "button-hosted-activation-ownership-gated",
  "Total hosted ownership criteria: 5",
  "Blocked until prior gate: 5",
  "Accepted hosted ownership criteria: 0",
  "No hosted Convex deployment is created or selected.",
  "No hosted project URL, billing detail, dashboard detail, or env value is recorded in committed source.",
  "No secret values are read or printed.",
  "No Convex codegen is run.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, action, smoke execution, production import, or provider write is performed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellHostedActivationOwnershipReview",
  "hostedOwnershipReview: ShellHostedActivationOwnershipReview",
  "hostedOwnershipReview: {",
  "status: \"prepare_only_hosted_ownership_review\"",
  "decisionId: \"hosted-convex-ownership\"",
  "totalCriteria: 5",
  "blockedUntilPriorGate: 5",
  "acceptedCriteria: 0",
  "reviewPacketPath: \"docs/phase123-hosted-activation-ownership-review.md\"",
  "canRecordDecision: false",
  "canCreateHostedDeployment: false",
  "canSelectHostedProject: false",
  "canEnterEnvValues: false",
  "canRunCodegen: false",
  "canImportGeneratedApi: false",
  "canExecuteLiveSmoke: false",
  "canReadSecrets: false",
  "canPrintSecrets: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "section-kinflo-hosted-activation-ownership-review",
  "section-kinflo-hosted-activation-ownership-summary",
  "text-hosted-activation-ownership-next-gate",
  "section-kinflo-hosted-activation-ownership-criteria-scroll",
  "section-kinflo-hosted-activation-ownership-blocked-actions",
  "button-hosted-activation-ownership-gated",
  "snapshot.hostedActivationRunbook.hostedOwnershipReview",
  "Ownership gated",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase123-hosted-activation-ownership-review.md\"",
  "\"npm run kinflo:validate-hosted-activation-ownership-review\"",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 123 hosted activation ownership review",
  "npm run kinflo:validate-hosted-activation-ownership-review",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-activation-ownership-review\"",
]);

const shellData = read("client/src/lib/kinfloShellData.ts");
const reviewStart = shellData.indexOf("hostedOwnershipReview: {");
const reviewEnd = shellData.indexOf("decisionRegister: [", reviewStart);
const reviewBlock = reviewStart >= 0 && reviewEnd > reviewStart ? shellData.slice(reviewStart, reviewEnd) : "";
const criterionIds = (reviewBlock.match(/id: "/g) ?? []).length;

if (criterionIds === 5) {
  pass("hosted ownership review criterion count matches packet");
} else {
  fail("hosted ownership review criterion count matches packet", `Found ${criterionIds}.`);
}

const generatedImportMarkers = [
  "from \"convex/_generated/api\"",
  "from 'convex/_generated/api'",
  "import(\"convex/_generated/api\")",
  "import('convex/_generated/api')",
];
const reviewFiles = [
  "docs/phase123-hosted-activation-ownership-review.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
];

for (const path of reviewFiles) {
  const contents = read(path);
  if (generatedImportMarkers.some((marker) => contents.includes(marker))) {
    fail(`${path} does not import generated API`, "Generated API imports remain gated until hosted activation approval.");
  } else {
    pass(`${path} does not import generated API`);
  }
}

const shellPage = read("client/src/pages/AdminKinfloShell.tsx");
if (shellPage.includes("useMutation(") || shellPage.includes("useAction(")) {
  fail("hosted ownership review does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("hosted ownership review does not execute live Convex");
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

console.log("\nKinFlo hosted activation ownership review validation");
console.log("Admin route: /admin/kinflo-os?tab=hosted-activation");
console.log("Hosted ownership criteria: 5");
console.log("Hosted deployment created or selected: no");
console.log("Hosted env values entered: no");
console.log("Hosted project URL recorded in source: no");
console.log("Secret values read: no");
console.log("Secret values printed: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted activation ownership review validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted activation ownership review validation passed: ${checks.length} checks.`);
