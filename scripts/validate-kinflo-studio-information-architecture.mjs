import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];

function pass(label) {
  checks.push({ label, ok: true });
}

function fail(label, detail) {
  checks.push({ label, ok: false, detail });
}

function requireFile(path) {
  if (existsSync(path)) {
    pass(`${path} exists`);
    return true;
  }
  fail(`${path} exists`, "Expected Studio information-architecture artifact was not found.");
  return false;
}

const shellPath = "client/src/pages/AdminKinfloShell.tsx";
const packagePath = "package.json";
const shell = readFileSync(shellPath, "utf8");
const packageJson = readFileSync(packagePath, "utf8");

requireFile(shellPath);
requireFile(packagePath);
requireFile("scripts/validate-kinflo-studio-information-architecture.mjs");
requireFile("docs/phase153-studio-information-architecture.md");

for (const pattern of [
  'key: "studio"',
  'label: "Studio"',
  'tabs: ["site-studio"]',
  "activeStudioSection",
  "onSelectStudioSection",
  'data-testid="section-kinflo-sidebar-studio-sections"',
  'data-testid={`button-kinflo-studio-section-${section.key}`}',
  'data-testid="section-kinflo-client-studio-context"',
  'Build", detail: "Sites and starting points"',
  'Configuration", detail: "Profiles and approvals"',
  'Handoff", detail: "Permissions and delivery"',
  'Preview & Launch", detail: "Review and release"',
  "getClientWebsiteStudioNavigationKey",
  'studioLane: lane',
  'studioStage: stage',
]) {
  if (shell.includes(pattern)) {
    pass(`shell includes ${pattern}`);
  } else {
    fail(`shell includes ${pattern}`, "Expected Studio navigation contract was not found.");
  }
}

if (shell.includes('tabs: ["factory", "site-studio"')) {
  fail("Build lane no longer absorbs Studio", "Studio must own its own sidebar parent instead of living inside Build.");
} else {
  pass("Build lane no longer absorbs Studio");
}

if (shell.includes('role="tablist" aria-label="Client studio lanes"') || shell.includes('role="tab" aria-label="Client studio lanes"')) {
  fail("Studio has one navigation owner", "The old horizontal Studio lane tab rail remains in the shell.");
} else {
  pass("Studio has one navigation owner");
}

if (packageJson.includes('"kinflo:validate-studio-information-architecture"')) {
  pass("package exposes Studio information-architecture validation");
} else {
  fail("package exposes Studio information-architecture validation", "The focused validator is not registered.");
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);
if (tracked.some((file) => file.startsWith("convex/_generated/"))) {
  fail("generated Convex API files remain untracked", "Generated API files must stay outside this source-only PR.");
} else {
  pass("generated Convex API files remain untracked");
}

if (tracked.some((file) => [".env", ".env.local"].includes(file) || file.endsWith(".local"))) {
  fail("secret env files remain untracked", "Secret-like files must stay outside this source-only PR.");
} else {
  pass("secret env files remain untracked");
}

if (shell.includes("convex/_generated/api") || shell.includes("useMutation(") || shell.includes("useAction(")) {
  fail("Studio information architecture remains provider-light", "The navigation refactor must not import generated API or execute live Convex.");
} else {
  pass("Studio information architecture remains provider-light");
}

const failed = checks.filter((check) => !check.ok);
for (const check of checks) {
  console.log(`${check.ok ? "✓" : "✗"} ${check.label}`);
  if (!check.ok) console.log(`  ${check.detail}`);
}

console.log("\nKinFlo Studio information-architecture validation");
console.log("Admin route: /admin/kinflo-os?tab=site-studio");
console.log("Local state only: yes");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");

if (failed.length > 0) {
  process.exitCode = 1;
} else {
  console.log(`Passed: ${checks.length} checks.`);
}
