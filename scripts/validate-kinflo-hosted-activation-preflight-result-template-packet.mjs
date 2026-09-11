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

function readJson(path) {
  return JSON.parse(read(path));
}

function requireFile(path) {
  if (existsSync(path)) {
    pass(`${path} exists`);
    return true;
  }
  fail(`${path} exists`, "Expected hosted activation preflight result template packet artifact was not found.");
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
      fail(`${path} includes ${pattern}`, "Expected hosted activation preflight result template packet text was not found.");
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
  "docs/phase131-hosted-activation-preflight-result-template-packet.md",
  "docs/phase130-hosted-activation-preflight-result-template.md",
  "docs/convex-activation-preflight-result-template.json",
  "client/src/lib/kinfloShellData.ts",
  "client/src/pages/AdminKinfloShell.tsx",
  "scripts/validate-kinflo-hosted-activation-preflight-result-template-packet.mjs",
  "package.json",
]) {
  requireFile(path);
}

requireIncludes("docs/phase131-hosted-activation-preflight-result-template-packet.md", [
  "Phase 131: Hosted Activation Preflight Result Template Packet",
  "npm run kinflo:validate-hosted-activation-preflight-result-template-packet",
  "activationPreflightResultTemplatePacket",
  "ShellHostedActivationPreflightResultTemplatePacket",
  "ShellHostedActivationPreflightResultTemplateField",
  "docs/convex-activation-preflight-result-template.json",
  "section-kinflo-hosted-preflight-result-template-packet",
  "section-kinflo-hosted-preflight-result-template-packet-summary",
  "text-kinflo-hosted-preflight-result-template-packet",
  "section-kinflo-hosted-preflight-result-template-fields",
  "section-kinflo-hosted-preflight-result-template-rules",
  "button-hosted-preflight-result-template-packet-gated",
  "No hosted Convex deployment is created or selected.",
  "No activation preflight is run against real hosted env values.",
  "No generated Convex API files are committed or imported.",
  "No live Convex query, mutation, or action is executed.",
  "No hosted preflight result is recorded.",
]);

requireIncludes("client/src/lib/kinfloShellData.ts", [
  "ShellHostedActivationPreflightResultTemplateField",
  "ShellHostedActivationPreflightResultTemplatePacket",
  "activationPreflightResultTemplatePacket: ShellHostedActivationPreflightResultTemplatePacket",
  "phase: 131",
  "status: \"prepare_only_preflight_result_template_packet\"",
  "command: \"npm run kinflo:dry-run-activation-preflight-result\"",
  "validator: \"npm run kinflo:validate-hosted-activation-preflight-result-template-packet\"",
  "templatePath: \"docs/convex-activation-preflight-result-template.json\"",
  "reviewRoute: \"/admin/kinflo-os?tab=hosted-activation&preflightResult=preflight-result-status\"",
  "resultFieldCount: 6",
  "local-env-present",
  "generated-directory-present",
  "hosted-env-visible",
  "external-writes",
  "hosted-deployment-touched",
  "preflight-result-status",
  "canRecordResult: false",
  "canEnterEnvValues: false",
  "canRunAgainstRealEnv: false",
  "canCommitRawLogs: false",
  "canRunCodegen: false",
  "canCommitGeneratedApi: false",
  "canImportGeneratedApi: false",
  "canExecuteLiveSmoke: false",
  "canReadSecrets: false",
  "canPrintSecrets: false",
  "providerWrites: false",
  "liveConvexExecution: false",
]);

requireIncludes("client/src/pages/AdminKinfloShell.tsx", [
  "section-kinflo-hosted-preflight-result-template-packet",
  "section-kinflo-hosted-preflight-result-template-packet-summary",
  "text-kinflo-hosted-preflight-result-template-packet",
  "section-kinflo-hosted-preflight-result-template-fields",
  "section-kinflo-hosted-preflight-result-template-rules",
  "button-hosted-preflight-result-template-packet-gated",
  "snapshot.hostedActivationRunbook.activationPreflightResultTemplatePacket.command",
  "snapshot.hostedActivationRunbook.activationPreflightResultTemplatePacket.validator",
  "snapshot.hostedActivationRunbook.activationPreflightResultTemplatePacket.fields.map",
  "Template review gated",
]);

requireIncludes("package.json", [
  "\"kinflo:validate-hosted-activation-preflight-result-template-packet\"",
]);

const template = readJson("docs/convex-activation-preflight-result-template.json");
const expectedFieldIds = [
  "local-env-present",
  "generated-directory-present",
  "hosted-env-visible",
  "external-writes",
  "hosted-deployment-touched",
  "preflight-result-status",
];
const templateFieldIds = Array.isArray(template.resultFields) ? template.resultFields.map((field) => field.id) : [];

if (template.phase === 130) {
  pass("source template remains Phase 130");
} else {
  fail("source template remains Phase 130", `Found ${template.phase}.`);
}

if (template.status === "prepare_only_activation_preflight_result_template") {
  pass("source template remains prepare-only");
} else {
  fail("source template remains prepare-only", `Found ${template.status}.`);
}

if (templateFieldIds.length === expectedFieldIds.length && expectedFieldIds.every((id) => templateFieldIds.includes(id))) {
  pass("source template field ids match packet");
} else {
  fail("source template field ids match packet", `Found ${templateFieldIds.join(", ")}.`);
}

const shellContents = read("client/src/pages/AdminKinfloShell.tsx");
const dataContents = read("client/src/lib/kinfloShellData.ts");
const combinedContents = `${shellContents}\n${dataContents}`;

const importsGeneratedApi =
  combinedContents.includes("from \"convex/_generated/api\"") ||
  combinedContents.includes("from 'convex/_generated/api'") ||
  combinedContents.includes("import(\"convex/_generated/api\")") ||
  combinedContents.includes("import('convex/_generated/api')");
if (importsGeneratedApi) {
  fail("template packet does not import generated API", "Generated API imports remain gated until hosted activation approval.");
} else {
  pass("template packet does not import generated API");
}

if (shellContents.includes("useMutation(") || shellContents.includes("useAction(")) {
  fail("template packet does not execute live Convex", "Live Convex execution must remain blocked.");
} else {
  pass("template packet does not execute live Convex");
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

console.log("\nKinFlo hosted activation preflight result template packet validation");
console.log("Admin route: /admin/kinflo-os?tab=hosted-activation&preflightResult=preflight-result-status");
console.log("Template path: docs/convex-activation-preflight-result-template.json");
console.log("Template packet phase: 131");
console.log("Source template phase: 130");
console.log("Result fields: 6");
console.log("Hosted env values read or printed: no");
console.log("Activation preflight against real env: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider writes: 0");
console.log("Hosted preflight result recorded: no");

if (failed.length > 0) {
  console.error(`\nKinFlo hosted activation preflight result template packet validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo hosted activation preflight result template packet validation passed: ${checks.length} checks.`);
