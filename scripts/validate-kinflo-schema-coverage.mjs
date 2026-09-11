import { readFileSync } from "node:fs";

const schemaPath = "convex/schema.ts";
const mapPath = "docs/drizzle-to-convex-migration-map.md";

const schema = readFileSync(schemaPath, "utf8");
const migrationMap = readFileSync(mapPath, "utf8");

const checks = [];

function pass(label) {
  checks.push({ label, ok: true });
}

function fail(label, detail) {
  checks.push({ label, ok: false, detail });
}

function requireIncludes(path, contents, patterns) {
  for (const pattern of patterns) {
    if (contents.includes(pattern)) {
      pass(`${path} includes ${pattern}`);
    } else {
      fail(`${path} includes ${pattern}`, "Expected schema coverage text was not found.");
    }
  }
}

const schemaCollections = [...schema.matchAll(/^\s{2}([A-Za-z][A-Za-z0-9]*): defineTable\(/gm)]
  .map((match) => match[1])
  .sort();

const phaseMinimums = {
  phase1: [
    "users",
    "tenants",
    "sites",
    "memberships",
    "roles",
    "invitations",
    "themeTokens",
    "featureFlags",
    "auditEvents",
  ],
  phase2: [
    "pages",
    "pageRevisions",
    "contentBlocks",
    "contentVisibilityRules",
    "navigationItems",
    "assets",
    "publishEvents",
  ],
  phase3: [
    "leads",
    "leadEvents",
    "pipelineStages",
    "leadAssignments",
    "tasks",
    "pipelineEvents",
    "journeyProgressionRules",
    "journeyProgressionEvents",
  ],
};

for (const [phase, collections] of Object.entries(phaseMinimums)) {
  for (const collection of collections) {
    if (schemaCollections.includes(collection)) {
      pass(`${phase} schema collection exists: ${collection}`);
    } else {
      fail(`${phase} schema collection exists: ${collection}`, `Add ${collection} to ${schemaPath}.`);
    }

    if (migrationMap.includes(`\`${collection}\``)) {
      pass(`${phase} migration map names: ${collection}`);
    } else {
      fail(`${phase} migration map names: ${collection}`, `Add ${collection} to ${mapPath}.`);
    }
  }
}

for (const collection of [
  "sites",
  "domains",
  "memberships",
  "invitations",
  "navigationItems",
  "pages",
  "pageRevisions",
  "contentBlocks",
  "contentVisibilityRules",
  "assets",
  "themeTokens",
  "publishEvents",
  "leads",
  "leadEvents",
  "pipelineStages",
  "leadAssignments",
  "tasks",
  "pipelineEvents",
  "journeyProgressionRules",
  "journeyProgressionEvents",
]) {
  const tableMatch = schema.match(new RegExp(`${collection}: defineTable\\(\\{([\\s\\S]*?)\\n\\s*\\}\\)`));
  if (!tableMatch) {
    fail(`${collection} has table body`, `Could not inspect ${collection} in ${schemaPath}.`);
    continue;
  }

  const body = tableMatch[1];
  if (body.includes("tenantId") || collection === "sites") {
    pass(`${collection} has tenant scope or is tenant-owned root`);
  } else {
    fail(`${collection} has tenant scope or is tenant-owned root`, "Expected tenantId for tenant/site-scoped records.");
  }
}

requireIncludes("docs/drizzle-to-convex-migration-map.md", migrationMap, [
  "## Phase 1 Minimum Schema",
  "## Phase 2 Minimum Public Renderer",
  "## Phase 3 Minimum CRM Migration",
  "Every tenant-scoped document should include:",
  "Every site-scoped document should also include:",
]);

requireIncludes("convex/schema.ts", schema, [
  "pipelineEvents: defineTable",
  "journeyProgressionRules: defineTable",
  "journeyProgressionEvents: defineTable",
  ".index(\"by_site_createdAt\", [\"siteId\", \"createdAt\"])",
  ".index(\"by_site_active\", [\"siteId\", \"isActive\"])",
]);

console.log("KinFlo Convex schema coverage validation");
console.log(`Schema collections: ${schemaCollections.length}`);
console.log(`Phase 1 minimum collections: ${phaseMinimums.phase1.length}`);
console.log(`Phase 2 minimum collections: ${phaseMinimums.phase2.length}`);
console.log(`Phase 3 minimum collections: ${phaseMinimums.phase3.length}`);
console.log("Generated API imported: no");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Live Convex execution: no");

const failed = checks.filter((check) => !check.ok);

for (const check of checks) {
  if (check.ok) {
    console.log(`✓ ${check.label}`);
  } else {
    console.error(`✗ ${check.label}`);
    console.error(`  ${check.detail}`);
  }
}

if (failed.length > 0) {
  console.error(`\nKinFlo Convex schema coverage validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nKinFlo Convex schema coverage validation passed: ${checks.length} checks.`);
