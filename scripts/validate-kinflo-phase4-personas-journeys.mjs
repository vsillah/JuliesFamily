import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const checks = [];
const check = (label, condition, detail) => checks.push({ label, condition, detail });
const read = (path) => readFileSync(path, "utf8");
const audience = read("client/src/lib/kinfloAudiencePreview.ts");
const admin = read("client/src/pages/AdminKinfloShell.tsx");
const publicPreview = read("client/src/pages/KinfloPublicSitePreview.tsx");
const publicPreviewResolver = read("client/src/lib/kinfloPublicSitePreview.ts");
const packageJson = JSON.parse(read("package.json"));
const changedFiles = execFileSync("git", ["diff", "--name-only", "origin/main...HEAD"], { encoding: "utf8" }).split("\n").filter(Boolean);

check("audience preview contract exists", existsSync("client/src/lib/kinfloAudiencePreview.ts"));
check("definitions are site-scoped", audience.includes("tenantSlug") && audience.includes("siteSlug") && audience.includes("resolveKinfloAudienceContract"));
check("scope mismatch fails closed", audience.includes("The requested tenant and site scopes do not match") && audience.includes("status: \"invalid\""));
check("preview links are explicitly read-only", audience.includes('previewMode: "read_only"') && audience.includes('audienceMode: "preview_only"'));
check("visibility requires same tenant and site", audience.includes("rule.tenantSlug !== context.tenantSlug") && audience.includes("rule.siteSlug !== context.siteSlug"));
check("unknown or invalid preview contexts produce no blocks", audience.includes("if (resolution.status !== \"ready\") return []"));
check("admin preview uses the Phase 4 contract", admin.includes("kinfloAudiencePreview") && admin.includes("buildKinfloAudiencePreviewHref"));
check("public preview uses the Phase 4 contract", publicPreview.includes('studioTenant') && publicPreviewResolver.includes("filterKinfloPreviewBlocks") && publicPreviewResolver.includes("resolveKinfloAudiencePreview"));
check("Julie names are fixture-only", !audience.includes("Julie's Family") && audience.includes('"julies-family"'));
check("focused test script is registered", packageJson.scripts?.["kinflo:test-phase4-personas-journeys"] === "node --import tsx --test scripts/test-kinflo-phase4-personas-journeys.ts");
check("no convex or environment files changed", !changedFiles.some((file) => file.startsWith("convex/") || file.includes(".env")));

for (const item of checks) {
  console.log(`${item.condition ? "✓" : "✗"} ${item.label}`);
  if (!item.condition && item.detail) console.log(`  ${item.detail}`);
}
const failed = checks.filter((item) => !item.condition);
if (failed.length) process.exit(1);
console.log(`\nKinFlo Phase 4 personas and journeys validation passed: ${checks.length} checks.`);
