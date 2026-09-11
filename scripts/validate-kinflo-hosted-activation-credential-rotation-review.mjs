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
  fail(`${path} exists`, "Expected hosted activation credential rotation review artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted activation credential rotation review text was not found.");
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
  "docs/phase121-hosted-activation-credential-rotation-review.md",
  "docs/phase73-hosted-activation-decision-register.md",
  "docs/phase85-hosted-activation-approval-packet.md",
  "docs/phase96-hosted-activation-owner-checklist.md",
  "docs/phase120-hosted-activation-decision-checkpoint.md",
  "docs/kinflo-saas-execution-ledger.json",
  "docs/phase72-saas-execution-ledger.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "package.json",
  "scripts/validate-kinflo-hosted-activation-credential-rotation-review.mjs",
]) {
  requireFile(path);
}

requireIncludes("docs/phase121-hosted-activation-credential-rotation-review.md", [
  "Phase 121: Hosted Activation Credential Rotation Review",
  "npm run kinflo:validate-hosted-activation-credential-rotation-review",
  "hostedActivationRunbook.credentialRotationReview",
  "ShellHostedActivationCredentialRotationReview",
  "section-kinflo-hosted-activation-credential-rotation-review",
  "section-kinflo-hosted-activation-credential-rotation-summary",
  "text-hosted-activation-credential-rotation-next-gate",
  "section-kinflo-hosted-activation-credential-family-scroll",
  "section-kinflo-hosted-activation-credential-blocked-actions",
  "button-hosted-activation-credential-rotation-gated",
  "Total credential families: 7",
  "Pending credential families: 7",
  "Accepted credential families: 0",
  "No approval value is recorded in committed source.",
  "No secret values are read or printed.",
  "No provider credentials are rotated, moved, copied, tested, or validated by this repo.",
  "No hosted Convex deployment is created.",
  "No Convex codegen is run.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, action, or smoke execution is performed.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellHostedActivationCredentialRotationReview",
  "credentialRotationReview: ShellHostedActivationCredentialRotationReview",
  "credentialRotationReview: {",
  "status: \"prepare_only_credential_rotation_review\"",
  "decisionId: \"credential-rotation-review\"",
  "totalCredentialFamilies: 7",
  "pendingCredentialFamilies: 7",
  "acceptedCredentialFamilies: 0",
  "reviewPacketPath: \"docs/phase121-hosted-activation-credential-rotation-review.md\"",
  "canRecordDecision: false",
  "canReadSecrets: false",
  "canPrintSecrets: false",
  "canRotateSecrets: false",
  "canValidateProviderCredentials: false",
  "canCreateHostedDeployment: false",
  "canRunCodegen: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "section-kinflo-hosted-activation-credential-rotation-review",
  "section-kinflo-hosted-activation-credential-rotation-summary",
  "text-hosted-activation-credential-rotation-next-gate",
  "section-kinflo-hosted-activation-credential-family-scroll",
  "section-kinflo-hosted-activation-credential-blocked-actions",
  "button-hosted-activation-credential-rotation-gated",
  "snapshot.hostedActivationRunbook.credentialRotationReview",
  "Credential review gated",
]);

requireIncludes("docs/kinflo-saas-execution-ledger.json", [
  "\"docs/phase121-hosted-activation-credential-rotation-review.md\"",
  "\"npm run kinflo:validate-hosted-activation-credential-rotation-review\"",
]);

requireIncludes("docs/phase72-saas-execution-ledger.md", [
  "Phase 121 hosted activation credential rotation review",
  "npm run kinflo:validate-hosted-activation-credential-rotation-review",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-activation-credential-rotation-review\"",
]);

const shellData = read("client/src/lib/kinfloShellData.ts");
const reviewStart = shellData.indexOf("credentialRotationReview: {");
const reviewEnd = shellData.indexOf("decisionRegister: [", reviewStart);
const reviewBlock = reviewStart >= 0 && reviewEnd > reviewStart ? shellData.slice(reviewStart, reviewEnd) : "";
const familyIds = (reviewBlock.match(/id: "/g) ?? []).length;

if (familyIds === 7) {
  pass("credential rotation review family count matches packet");
} else {
  fail("credential rotation review family count matches packet", `Found ${familyIds}.`);
}

const generatedImportMarkers = [
  "from \"convex/_generated/api\"",
  "from 'convex/_generated/api'",
  "import(\"convex/_generated/api\")",
  "import('convex/_generated/api')",
];
const checkpointFiles = [
  "docs/phase121-hosted-activation-credential-rotation-review.md",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
];

for (const path of checkpointFiles) {
  const contents = read(path);
  if (generatedImportMarkers.some((marker) => contents.includes(marker))) {
    fail(`${path} does not import generated API`, "Generated API imports remain gated until hosted activation approval.");
  } else {
    pass(`${path} does not import generated API`);
  }
}

const shellPage = read("client/src/pages/AdminKinfloShell.tsx");
if (shellPage.includes("useMutation(") || shellPage.includes("useAction(")) {
  fail("credential rotation review does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("credential rotation review does not execute live Convex");
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

console.log("\nKinFlo hosted activation credential rotation review validation");
console.log("Admin route: /admin/kinflo-os?tab=hosted-activation");
console.log("Credential families: 7");
console.log("Secret values read: no");
console.log("Secret values printed: no");
console.log("Credential rotation performed: no");
console.log("Provider credential validation performed: no");
console.log("Hosted deployment touched: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider APIs touched: no");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted activation credential rotation review validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted activation credential rotation review validation passed: ${checks.length} checks.`);
