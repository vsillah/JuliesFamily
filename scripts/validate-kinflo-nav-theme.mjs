import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const check = (condition, label, detail) => checks.push({ ok: Boolean(condition), label, detail });
const read = (path) => readFileSync(path, "utf8");

const shellPath = "client/src/pages/AdminKinfloShell.tsx";
const dashboardShellPath = "client/src/components/KinfloDashboardShell.tsx";
const cssPath = "client/src/index.css";
const packagePath = "package.json";
const projectRulePath = "AGENTS.md";
for (const path of [shellPath, dashboardShellPath, cssPath, packagePath, projectRulePath]) {
  check(existsSync(path), `${path} exists`, "Expected navigation/theme artifact is missing.");
}

if (existsSync(shellPath)) {
  const shell = read(shellPath);
  for (const marker of [
    "useVanguardTheme",
    "VanguardThemeControl",
    "KinfloPillCluster",
    "kinflo-pill-warning",
    "kinflo-workspace-lane-card",
    "kinflo-workspace-lane-description",
    "bg-card text-foreground hover:border-primary/50 hover:bg-muted",
    "text-muted-foreground",
    "border-border bg-muted text-muted-foreground",
    "kinflo-pill-success",
    "kinflo-pill-info",
    "kinflo-pill-warning",
    "kinflo-pill-neutral",
    "kinflo-metric-card",
    "data-filter-target={filterTarget.tab}",
    'tenants: { tab: "tenants"',
    'sites: { tab: "sites"',
    'templates: { tab: "templates"',
    'leads: { tab: "crm"',
    'launchGates: { tab: "launch-readiness"',
    "aria-pressed={isActiveFilter}",
    "section-kinflo-tenant-control-plane-table",
    "section-kinflo-site-factory-queue-table",
    "Previous table page",
    "Next table page",
    "No tenants match this search.",
    "No sites match this search.",
  ]) {
    check(shell.includes(marker), `admin shell includes ${marker}`, "The read-only navigation/theme contract is incomplete.");
  }
  check(!shell.includes("convex/_generated/api"), "admin shell excludes generated Convex bindings", "This UX lane must remain source-only.");
  check(!shell.includes("useMutation(") && !shell.includes("useAction("), "admin shell excludes live Convex execution", "Mutation/action execution must remain gated.");
}

if (existsSync(dashboardShellPath)) {
  const dashboardShell = read(dashboardShellPath);
  for (const marker of [
    "border-border bg-card p-3 text-foreground",
    "border-border bg-muted/70",
    "text-muted-foreground",
    "dark:text-amber-200",
    "dark:text-emerald-200",
  ]) {
    check(dashboardShell.includes(marker), `dashboard shell includes ${marker}`, "Workspace cards must use shared light/dark theme tokens.");
  }
  check(!dashboardShell.includes("bg-white") && !dashboardShell.includes("bg-slate-50"), "dashboard shell excludes light-only surfaces", "Dashboard workspace cards must not force light-mode backgrounds.");
}

if (existsSync(projectRulePath)) {
  const projectRules = read(projectRulePath);
  check(projectRules.includes("## Dashboard Metric Cards"), "project rule requires actionable metric cards", "Dashboard metrics must lead to their underlying read-only data.");
  check(projectRules.includes("read-only") && projectRules.includes("no-mutation"), "project rule preserves read-only card behavior", "Metric navigation must not introduce live writes.");
}

if (existsSync(cssPath)) {
  const css = read(cssPath);
  for (const marker of [
    ".kinflo-admin-shell",
    ".kinflo-admin-shell .kinflo-pill-success",
    ".kinflo-admin-shell .kinflo-pill-info",
    ".kinflo-admin-shell .kinflo-pill-warning",
    ".dark .kinflo-admin-shell .kinflo-workspace-lane-card",
    ".dark .kinflo-admin-shell",
    "hsl(var(--foreground))",
    "hsl(var(--muted-foreground))",
  ]) {
    check(css.includes(marker), `theme CSS includes ${marker}`, "Shared light/dark theme tokens are incomplete.");
  }
}

if (existsSync(packagePath)) {
  check(read(packagePath).includes('"kinflo:validate-nav-theme"'), "package exposes nav/theme validation", "The focused validator is not wired into package scripts.");
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);
check(!tracked.some((file) => file.startsWith("convex/_generated/")), "generated Convex bindings remain untracked", "Generated API files must remain outside this source-only lane.");
check(!tracked.includes(".env.local"), ".env.local remains untracked", "Secret environment files must remain outside this lane.");

for (const item of checks) {
  console[item.ok ? "log" : "error"](`${item.ok ? "✓" : "✗"} ${item.label}`);
  if (!item.ok) console.error(`  ${item.detail}`);
}

const failed = checks.filter((item) => !item.ok);
console.log("\nKinFlo navigation/theme validation");
console.log("Themes: light, dark, system");
console.log("Responsive tables: search, empty recovery, pagination");
console.log("External writes: 0");
console.log("Convex codegen/deploy: no");
if (failed.length) {
  console.error(`\nValidation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}
console.log(`\nValidation passed: ${checks.length} checks.`);
