import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const check = (condition, label, detail) => checks.push({ ok: Boolean(condition), label, detail });
const read = (path) => readFileSync(path, "utf8");

const files = {
  hook: "client/src/hooks/useVanguardTheme.ts",
  control: "client/src/components/VanguardThemeControl.tsx",
  publicPage: "client/src/pages/KinfloPublicSitePreview.tsx",
  intake: "client/src/components/VanguardReversRIntake.tsx",
  portal: "client/src/pages/VanguardOrderPortal.tsx",
  capture: "scripts/capture-vanguard-theme-contrast-qa.mjs",
  readme: "docs/qa/vanguard-theme-contrast/README.md",
  video: "docs/qa/vanguard-theme-contrast/vanguard-theme-contrast-walkthrough.mp4",
};

for (const path of Object.values(files)) check(existsSync(path), `${path} exists`, "Expected Vanguard theme artifact is missing.");

if (existsSync(files.hook)) {
  const hook = read(files.hook);
  for (const marker of ["kinflo:vanguard:theme:v1", '"light" | "dark" | "system"', "prefers-color-scheme: dark", 'classList.toggle("dark"']) {
    check(hook.includes(marker), `theme hook includes ${marker}`, "Saved/system theme behavior is incomplete.");
  }
}

if (existsSync(files.control)) {
  const control = read(files.control);
  for (const marker of ['aria-label="Color theme"', 'testId: "vanguard-theme-light"', 'testId: "vanguard-theme-dark"', 'testId: "vanguard-theme-system"', "aria-pressed={active}"]) {
    check(control.includes(marker), `theme control includes ${marker}`, "Accessible theme control marker is missing.");
  }
}

for (const path of [files.publicPage, files.intake, files.portal]) {
  if (!existsSync(path)) continue;
  const source = read(path);
  check(source.includes("dark:"), `${path} includes dark-mode variants`, "Vanguard surface still lacks dark-mode tokens.");
  check(!source.includes('from "convex/_generated/api"'), `${path} excludes generated Convex bindings`, "Theme work cannot introduce live bindings.");
  check(!source.includes("useMutation("), `${path} excludes live mutations`, "Theme work cannot introduce provider writes.");
}

if (existsSync(files.publicPage)) {
  const source = read(files.publicPage);
  for (const testId of ["public-preview-vanguard-order-backbone", "public-preview-vanguard-service-method", "public-preview-vanguard-customer-proof", "public-preview-vanguard-contact-location"]) {
    const start = source.indexOf(`data-testid="${testId}"`);
    check(start >= 0, `${testId} remains present`, "Existing Vanguard public surface marker was removed.");
  }
  check(source.includes('data-testid="vanguard-operational-checks"'), "concise operational checks remain present", "The post-request review boundary is missing.");
  check(!source.includes('data-testid="vanguard-request-to-delivery-lifecycle"'), "duplicate build lifecycle is removed", "The public page still repeats the customer order journey.");
  check(!source.includes('data-testid="public-preview-vanguard-project-phases"'), "duplicate project lifecycle cards are removed", "The public page still presents a third competing lifecycle.");
  check(source.includes("<VanguardReversRIntake />"), "ReversR desktop embed remains mounted", "Theme changes must preserve the ReversR embed.");
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n");
check(!tracked.includes(".env.local") && !existsSync(".env.local"), ".env.local remains absent and untracked", "This lane cannot create or track .env.local.");
check(!tracked.some((file) => file.startsWith("convex/_generated/")), "generated Convex bindings remain untracked", "This lane cannot add generated Convex bindings.");

for (const item of checks) {
  console[item.ok ? "log" : "error"](`${item.ok ? "✓" : "✗"} ${item.label}`);
  if (!item.ok) console.error(`  ${item.detail}`);
}

const failed = checks.filter((item) => !item.ok);
console.log("\nKinFlo Vanguard theme contrast validation");
console.log("Themes: light, dark, system");
console.log("External writes: 0");
console.log("Live persistence: disabled");
console.log("Convex codegen run: no");
if (failed.length) {
  console.error(`\nValidation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}
console.log(`\nValidation passed: ${checks.length} checks.`);
