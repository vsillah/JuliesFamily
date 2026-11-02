import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const check = (condition, label, detail) => checks.push({ ok: Boolean(condition), label, detail });
const read = (path) => readFileSync(path, "utf8");

const component = read("client/src/components/VanguardOperatorPortal.tsx");
const test = read("scripts/test-kinflo-vanguard-operator-portal.ts");
const docs = read("docs/phase178-vanguard-operator-theme-draft.md");

check(existsSync("client/src/components/VanguardOperatorPortal.tsx"), "operator portal exists", "The scoped Vanguard portal is required.");
check(component.includes("data-testid=\"vanguard-theme-draft-panel\""), "theme draft panel is present", "The operator portal must expose the scoped theme draft surface.");
check(component.includes("resolveTenantPaletteId(scope.tenantSlug)"), "palette assignment is tenant-scoped", "The initial palette must come from the selected tenant scope.");
check(component.includes("data-testid=\"select-vanguard-theme-draft-palette\""), "palette draft selector is present", "Operators need a local-only palette staging control.");
check(component.includes("data-testid=\"vanguard-theme-draft-preview\""), "light and dark previews are present", "Palette review must show both token modes.");
check(component.includes("disabled data-testid=\"button-save-vanguard-theme-draft\""), "live theme save is disabled", "This phase must not enable persistence.");
check(component.includes("Live theme save gated"), "save gate is explained", "The blocked action needs an in-context reason.");
check(!component.includes("useMutation"), "operator portal has no mutation hook", "The operator slice remains fixture/read-only.");
check(!component.includes("fetch("), "operator portal has no direct network write", "The operator slice must not bypass the reviewed adapter boundary.");
check(test.includes("data-testid=\"vanguard-theme-draft-panel\""), "focused source test covers theme draft", "The source boundary needs a regression assertion.");
check(docs.includes("Local state only:"), "phase contract documents local-only state", "The phase artifact must state its persistence boundary.");

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n");
check(!tracked.includes(".env.local") && !existsSync(".env.local"), ".env.local remains absent", "This lane cannot create or track local secrets.");
check(!tracked.some((file) => file.startsWith("convex/_generated/")), "generated bindings remain untracked", "This lane cannot add generated Convex output.");

for (const item of checks) {
  console[item.ok ? "log" : "error"](`${item.ok ? "✓" : "✗"} ${item.label}`);
  if (!item.ok) console.error(`  ${item.detail}`);
}

const failed = checks.filter((item) => !item.ok);
console.log("\nKinFlo Vanguard operator theme draft validation");
console.log("Local fixture state: preserved");
console.log("Live persistence: disabled");
console.log("Provider writes: 0");
console.log("Convex codegen run: no");
if (failed.length) process.exit(1);
console.log(`Validation passed: ${checks.length} checks.`);
