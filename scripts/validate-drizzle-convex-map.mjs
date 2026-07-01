import { readFileSync } from "node:fs";

const schemaPath = "shared/schema.ts";
const mapPath = "docs/drizzle-to-convex-migration-map.md";

const schema = readFileSync(schemaPath, "utf8");
const migrationMap = readFileSync(mapPath, "utf8");

const tableRegex = /export const ([A-Za-z0-9_]+)\s*=\s*pgTable\(/g;
const sourceTables = [...schema.matchAll(tableRegex)].map((match) => match[1]).sort();

const allowedUnmappedTables = new Map([
  ["sessions", "Auth/session storage is replaced by Convex Auth or provider-managed sessions."],
]);

const requiredNewCollections = [
  "tenants",
  "sites",
  "domains",
  "memberships",
  "roles",
  "invitations",
  "themeTokens",
  "navigationItems",
  "featureFlags",
  "publishEvents",
  "pages",
  "pageRevisions",
  "contentBlocks",
  "contentVisibilityRules",
  "assets",
  "leads",
  "leadEvents",
  "pipelineStages",
  "leadAssignments",
  "tasks",
  "auditEvents",
];

const requiredRuleText = [
  "Every tenant-scoped document should include:",
  "Every site-scoped document should also include:",
  "Convex function guards should enforce access.",
];

const checks = [];

function pass(label) {
  checks.push({ label, ok: true });
}

function fail(label, detail) {
  checks.push({ label, ok: false, detail });
}

function includesCodeToken(token) {
  return migrationMap.includes(`\`${token}\``);
}

for (const table of sourceTables) {
  if (includesCodeToken(table)) {
    pass(`Drizzle table mapped: ${table}`);
    continue;
  }

  if (allowedUnmappedTables.has(table)) {
    pass(`Drizzle table explicitly deferred: ${table}`);
    continue;
  }

  fail(`Drizzle table mapped: ${table}`, `Add \`${table}\` to ${mapPath} or allow it explicitly in ${new URL(import.meta.url).pathname}.`);
}

for (const collection of requiredNewCollections) {
  if (includesCodeToken(collection)) {
    pass(`Convex target named: ${collection}`);
  } else {
    fail(`Convex target named: ${collection}`, `Expected \`${collection}\` in ${mapPath}.`);
  }
}

for (const text of requiredRuleText) {
  if (migrationMap.includes(text)) {
    pass(`Migration rule present: ${text}`);
  } else {
    fail(`Migration rule present: ${text}`, `Expected rule text in ${mapPath}.`);
  }
}

const duplicateTables = sourceTables.filter((table, index) => sourceTables.indexOf(table) !== index);
if (duplicateTables.length === 0) {
  pass("No duplicate extracted Drizzle table constants");
} else {
  fail("No duplicate extracted Drizzle table constants", `Duplicate constants: ${duplicateTables.join(", ")}`);
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

console.log(`\nDrizzle tables found: ${sourceTables.length}`);
console.log(`Allowed explicit deferrals: ${allowedUnmappedTables.size}`);

if (failed.length > 0) {
  console.error(`\nDrizzle-to-Convex map validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nDrizzle-to-Convex map validation passed: ${checks.length} checks.`);
