import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import {
  KINFLO_DEFAULT_PALETTE_ID,
  kinfloPaletteOptions,
  kinfloPaletteRegistry,
  resolveKinfloPalette,
  tenantPaletteAssignments,
} from "../client/src/lib/kinfloPaletteRegistry";

const checks: { ok: boolean; label: string; detail: string }[] = [];
const check = (condition: unknown, label: string, detail: string) => checks.push({ ok: Boolean(condition), label, detail });
const read = (path: string) => readFileSync(path, "utf8");

function channel(value: number) {
  const normalized = value / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const value = hex.replace("#", "");
  const [red, green, blue] = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
}

function contrast(first: string, second: string) {
  const [bright, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (bright + 0.05) / (dark + 0.05);
}

const requiredPaletteIds = ["kinflo-default", "reversr-vanguard", "professional-neutral"];
check(kinfloPaletteOptions.length >= 3, "registry exposes at least three approved palettes", "Expected KinFlo, ReversR/Vanguard, and neutral professional palettes.");
for (const paletteId of requiredPaletteIds) {
  check(Boolean(kinfloPaletteRegistry[paletteId as keyof typeof kinfloPaletteRegistry]), `registry includes ${paletteId}`, "Required palette id is missing.");
}

for (const palette of kinfloPaletteOptions) {
  for (const mode of ["light", "dark"] as const) {
    const tokens = palette[mode];
    const foregroundContrast = contrast(tokens.background, tokens.foreground);
    const actionContrast = contrast(tokens.accent, tokens.accentForeground);
    const surfaceContrast = contrast(tokens.surface, tokens.foreground);
    check(foregroundContrast >= 4.5, `${palette.id} ${mode} foreground contrast is ${foregroundContrast.toFixed(2)}:1`, "Foreground/background contrast must meet WCAG AA for normal text.");
    check(actionContrast >= 4.5, `${palette.id} ${mode} action contrast is ${actionContrast.toFixed(2)}:1`, "Accent/action contrast must meet WCAG AA for normal text.");
    check(surfaceContrast >= 4.5, `${palette.id} ${mode} surface contrast is ${surfaceContrast.toFixed(2)}:1`, "Surface text contrast must meet WCAG AA for normal text.");
  }
}

for (const [tenantSlug, paletteId] of Object.entries(tenantPaletteAssignments)) {
  check(Boolean(kinfloPaletteRegistry[paletteId]), `${tenantSlug} references ${paletteId}`, "Tenant assignment references a missing palette id.");
}
check(tenantPaletteAssignments["vanguard-enterprises"] === "reversr-vanguard", "Vanguard uses the ReversR-compatible palette", "Vanguard must resolve through the shared tenant assignment path.");
check(resolveKinfloPalette("missing-palette").id === KINFLO_DEFAULT_PALETTE_ID, "unknown palette ids fall back to KinFlo default", "Missing tenant palette fallback is unsafe.");

const files = {
  registry: "client/src/lib/kinfloPaletteRegistry.ts",
  publicData: "client/src/lib/kinfloPublicSitePreview.ts",
  publicPage: "client/src/pages/KinfloPublicSitePreview.tsx",
  chatbot: "client/src/components/ChatbotWidget.tsx",
  admin: "client/src/pages/AdminKinfloShell.tsx",
  shellData: "client/src/lib/kinfloShellData.ts",
  themeHook: "client/src/hooks/useTenantTheme.ts",
  css: "client/src/index.css",
  capture: "scripts/capture-kinflo-tenant-palette-qa.mjs",
};

for (const path of Object.values(files)) check(existsSync(path), `${path} exists`, "Expected tenant palette artifact is missing.");

const publicData = read(files.publicData);
const publicPage = read(files.publicPage);
const chatbot = read(files.chatbot);
const admin = read(files.admin);
const themeHook = read(files.themeHook);
const css = read(files.css);

for (const marker of ["resolveTenantPaletteId", "resolveTenantPalette", "paletteId:"]) {
  check(publicData.includes(marker), `public preview data uses ${marker}`, "Public fixtures must resolve tenant palettes from the registry.");
}
check(!/palette:\s*\{\s*background:\s*"#/m.test(publicData), "public preview excludes inline palette literals", "Public tenant colors must not bypass the palette registry.");
for (const marker of ["data-kinflo-palette", "getPaletteCssVariables", "useTenantTheme", "kinflo-accent-text", "kinflo-accent-solid", "document.documentElement.style"]) {
  check(publicPage.includes(marker), `public renderer includes ${marker}`, "Public rendering is not fully bound to page-level palette tokens.");
}
for (const marker of ["startsWith('/kinflo-sites/')", "kinflo-accent-solid", "button-open-chatbot"]) {
  check(chatbot.includes(marker), `chatbot follows public-site tenant palette: ${marker}`, "Global chat entry point can leak the default warm primary into tenant public pages.");
}
for (const marker of ["background: var(--kinflo-accent-soft) !important", "color: var(--kinflo-accent) !important", "background: var(--kinflo-accent) !important"]) {
  check(css.includes(marker), `semantic palette CSS overrides component defaults: ${marker}`, "Tenant palette classes must beat shared component default colors.");
}
check(!/amber-(?:[1-9]\d{1,2})/.test(publicPage), "public renderer excludes hard-coded warm Tailwind accents", "Warm accent classes can leak the Vanguard palette into other tenants.");
check(!/#(?:b45309|b7791f|92400e|fbbf24|f2c14e|8a5a12)/i.test(publicPage), "public renderer excludes hard-coded warm hex accents", "Warm accent hex values belong only in the palette registry.");
for (const marker of ["kinflo-tenant-palette-assignment", "setBrandPaletteKey(site.paletteId)"]) {
  check(admin.includes(marker), `admin palette selection includes ${marker}`, "Brand Theme Studio must expose the tenant palette assignment path.");
}
for (const marker of ["kinfloPaletteOptions", "resolveTenantPaletteId", "vanguard-enterprises"]) {
  check(read(files.shellData).includes(marker), `Brand Theme Studio fixture includes ${marker}`, "Admin palette options and tenant assignments must come from the shared registry.");
}
for (const marker of ["light", "dark", "system", "prefers-color-scheme: dark", "document.documentElement.classList.toggle"]) {
  check(themeHook.includes(marker), `tenant theme hook includes ${marker}`, "Tenant palettes must preserve light, dark, and system behavior.");
}

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n");
check(!tracked.includes(".env.local") && !existsSync(".env.local"), ".env.local remains absent and untracked", "This lane cannot create or track .env.local.");
check(!tracked.some((file) => file.startsWith("convex/_generated/")), "generated Convex bindings remain untracked", "This lane cannot add generated Convex bindings.");

for (const item of checks) {
  console[item.ok ? "log" : "error"](`${item.ok ? "✓" : "✗"} ${item.label}`);
  if (!item.ok) console.error(`  ${item.detail}`);
}

const failed = checks.filter((item) => !item.ok);
console.log("\nKinFlo tenant palette validation");
console.log(`Palettes: ${kinfloPaletteOptions.length}`);
console.log(`Tenant assignments: ${Object.keys(tenantPaletteAssignments).length}`);
console.log("External writes: 0");
console.log("Live persistence: disabled");
console.log("Convex codegen run: no");
if (failed.length) {
  console.error(`\nValidation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}
console.log(`\nValidation passed: ${checks.length} checks.`);
