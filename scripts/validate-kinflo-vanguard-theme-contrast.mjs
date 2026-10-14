import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const check = (condition, label, detail) => checks.push({ ok: Boolean(condition), label, detail });
const read = (path) => readFileSync(path, "utf8");

const files = {
  hook: "client/src/hooks/useTenantTheme.ts",
  vanguardHook: "client/src/hooks/useVanguardTheme.ts",
  control: "client/src/components/VanguardThemeControl.tsx",
  publicPage: "client/src/pages/KinfloPublicSitePreview.tsx",
  intake: "client/src/components/VanguardReversRIntake.tsx",
  portal: "client/src/pages/VanguardOrderPortal.tsx",
  publicData: "client/src/lib/kinfloPublicSitePreview.ts",
  paletteRegistry: "client/src/lib/kinfloPaletteRegistry.ts",
  capture: "scripts/capture-vanguard-theme-contrast-qa.mjs",
  readme: "docs/qa/vanguard-theme-contrast/README.md",
  video: "docs/qa/vanguard-theme-contrast/vanguard-theme-contrast-walkthrough.mp4",
};

for (const path of Object.values(files)) check(existsSync(path), `${path} exists`, "Expected Vanguard theme artifact is missing.");

if (existsSync(files.hook)) {
  const hook = read(files.hook);
  for (const marker of ['"light" | "dark" | "system"', "prefers-color-scheme: dark", 'classList.toggle("dark"', "kinflo:tenant:"]) {
    check(hook.includes(marker), `theme hook includes ${marker}`, "Saved/system theme behavior is incomplete.");
  }
}

if (existsSync(files.vanguardHook)) {
  check(read(files.vanguardHook).includes("kinflo:vanguard:theme:v1"), "Vanguard storage-key compatibility remains present", "Existing Vanguard theme choices must remain compatible.");
}

if (existsSync(files.control)) {
  const control = read(files.control);
  for (const marker of ['aria-label="Color theme"', 'testId: "vanguard-theme-light"', 'testId: "vanguard-theme-dark"', 'testId: "vanguard-theme-system"', "aria-pressed={active}"]) {
    check(control.includes(marker), `theme control includes ${marker}`, "Accessible theme control marker is missing.");
  }
  check(!/(?:amber|orange|rose)-/.test(control), "theme control excludes conflicting warm accent utilities", "Use the Vanguard/ReversR blue active state in the page-wide theme control.");
  check(control.includes("bg-blue-600") && control.includes("dark:bg-blue-500"), "theme control uses blue active states", "The page-wide theme control must follow the ReversR-compatible primary role.");
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
  for (const marker of ["data-kinflo-palette={tenantPalette.id}", "getPaletteCssVariables", "kinflo-accent-text", "kinflo-accent-solid"]) {
    check(source.includes(marker), `Vanguard page uses tenant palette contract: ${marker}`, "The public shell is missing the shared tenant palette contract.");
  }
  for (const marker of ["data-vanguard-brand-palette", "VANGUARD_BRAND_STYLE", 'style={isVanguard ?']) {
    check(!source.includes(marker), `Vanguard page removed page-local palette override: ${marker}`, "The public shell should use the shared tenant palette registry instead of a Vanguard-only override.");
  }
  check(!/(?:amber|orange|rose)-/.test(source), "Vanguard public page excludes conflicting warm accent utilities", "Replace warm accent utilities with blue primary or emerald active and success roles.");
  check(source.includes("kinflo-accent-solid") && source.includes("kinflo-accent-text"), "Vanguard public page carries semantic palette role tokens", "The page-wide interaction palette is incomplete.");
  for (const marker of [
    'id="capabilities" className="border-y border-slate-200 bg-white',
    'id="about" className="bg-slate-50',
    'id="proof" className="border-y border-slate-200 bg-white',
    'id="careers" className="bg-slate-50',
    'id="contact-details" className="border-t border-slate-200 bg-white',
  ]) {
    check(source.includes(marker), `light-mode surface remains restrained: ${marker.split(' className=')[0]}`, "A Vanguard light-mode section acquired an unexpectedly dark surface.");
  }
}

if (existsSync(files.publicData)) {
  const source = read(files.publicData);
  const vanguardStart = source.indexOf('_id: "tenant_vanguard_fixture"');
  const vanguardEnd = source.indexOf('_id: "tenant_campaign_fixture"');
  const vanguard = source.slice(vanguardStart, vanguardEnd);
  const orderedBlocks = [
    'block_vanguard_hero',
    'block_vanguard_services',
    'block_vanguard_source_parity',
    'block_vanguard_order_backbone',
    'block_vanguard_process',
    'block_vanguard_request',
  ];
  const positions = orderedBlocks.map((id) => vanguard.indexOf(`_id: "${id}"`));
  check(positions.every((position) => position >= 0), "Vanguard public IA includes every required block", "A required Vanguard public block is missing.");
  check(positions.every((position, index) => index === 0 || position > positions[index - 1]), "Vanguard public IA puts information before conversion", "The ReversR conversion flow appears before Vanguard's informational content.");
  check(vanguard.includes('primaryCta: "Explore capabilities"'), "Vanguard hero leads to capabilities", "The hero still leads with the embedded order application.");
  for (const marker of ['paletteId: resolveTenantPaletteId("vanguard-enterprises")', 'palette: resolveTenantPalette("vanguard-enterprises").light']) {
    check(vanguard.includes(marker), `Vanguard fixture resolves tenant palette through registry: ${marker}`, "The source fixture has drifted from the shared ReversR-compatible palette assignment.");
  }
  check(!vanguard.includes("#b7791f"), "Vanguard fixture excludes its legacy warm accent", "The Vanguard fixture still contains the former clashing accent.");
}

if (existsSync(files.paletteRegistry)) {
  const source = read(files.paletteRegistry);
  const vanguardStart = source.indexOf('"reversr-vanguard"');
  const neutralStart = source.indexOf('"professional-neutral"');
  const reversrPalette = source.slice(vanguardStart, neutralStart);
  for (const marker of ['description: "Blue, graphite, and teal', 'accent: "#2563eb"', 'secondary: "#007a55"', 'accent: "#60a5fa"', 'secondary: "#5eead4"', '"vanguard-enterprises": "reversr-vanguard"']) {
    check(source.includes(marker), `palette registry includes ReversR/Vanguard token: ${marker}`, "The shared ReversR-compatible palette assignment is incomplete.");
  }
  check(!/(#8a5a12|#f8e8c2|#65420d|#f2c14e|#3e3218|#f8dc8b|gold)/i.test(reversrPalette), "ReversR/Vanguard palette excludes gold and warm accent drift", "The tenant registry reintroduced the clashing warm accent family.");
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
