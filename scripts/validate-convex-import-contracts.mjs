import { readFileSync } from "node:fs";

const manifestPath = "docs/convex-import-contracts/import-manifest.json";
const schemaPath = "shared/schema.ts";
const convexSchemaPath = "convex/schema.ts";

const manifestText = readFileSync(manifestPath, "utf8");
const manifest = JSON.parse(manifestText);
const sourceSchema = readFileSync(schemaPath, "utf8");
const convexSchema = readFileSync(convexSchemaPath, "utf8");

const sourceTables = new Set(
  [...sourceSchema.matchAll(/export const ([A-Za-z0-9_]+)\s*=\s*pgTable\(/g)]
    .map((match) => match[1]),
);

const convexCollections = new Set(
  [...convexSchema.matchAll(/^\s*([A-Za-z0-9_]+): defineTable\(/gm)]
    .map((match) => match[1]),
);

const requiredImplementedCollections = [
  "users",
  "tenants",
  "sites",
  "domains",
  "adminPreferences",
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
  "billingPlans",
  "tenantEntitlements",
];

const checks = [];

function pass(label) {
  checks.push({ label, ok: true });
}

function fail(label, detail) {
  checks.push({ label, ok: false, detail });
}

function requireCondition(label, condition, detail) {
  if (condition) {
    pass(label);
  } else {
    fail(label, detail);
  }
}

requireCondition("manifest schemaVersion is 1", manifest.schemaVersion === 1, "Update validator before changing manifest schema.");
requireCondition("manifest externalWrites is false", manifest.externalWrites === false, "Provider-light import contracts must not perform external writes.");
requireCondition("manifest hostedDeploymentRequired is false", manifest.hostedDeploymentRequired === false, "Hosted deployment is a separate approval gate.");
requireCondition("manifest has contracts", Array.isArray(manifest.contracts) && manifest.contracts.length > 0, "Add import contracts.");

const manifestHasLocalPath = /\/Users\//.test(manifestText);
const manifestHasEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(manifestText);
const manifestMentionsGeneratedConvex = /convex\/_generated|CONVEX_DEPLOYMENT/.test(manifestText);

requireCondition("manifest contains no local /Users paths", !manifestHasLocalPath, "Remove local absolute paths from hosted-facing import artifacts.");
requireCondition("manifest contains no email-shaped refs", !manifestHasEmail, "Use hashes or abstract references in import contracts.");
requireCondition("manifest does not mention Convex generated deployment state", !manifestMentionsGeneratedConvex, "Do not bind provider-light contracts to generated hosted state.");

const contracts = manifest.contracts ?? [];
const ids = contracts.map((contract) => contract.id);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
requireCondition("contract ids are unique", duplicateIds.length === 0, `Duplicate ids: ${duplicateIds.join(", ")}`);

const sortedIds = [...ids].sort();
requireCondition("contract ids are sorted", ids.every((id, index) => id === sortedIds[index]), "Keep manifest contracts sorted by id for deterministic diffs.");

for (const contract of contracts) {
  requireCondition(`${contract.id} externalWrites false`, contract.externalWrites === false, "Every contract must be dry-run safe.");
  requireCondition(`${contract.id} has idempotencyKey`, typeof contract.idempotencyKey === "string" && contract.idempotencyKey.length > 0, "Add a deterministic idempotency key.");
  requireCondition(`${contract.id} idempotencyKey is non-volatile`, !contract.idempotencyKey.includes("generatedAt"), "Do not use volatile fields in idempotency keys.");
  requireCondition(`${contract.id} target collection exists`, convexCollections.has(contract.targetCollection), `Missing Convex collection: ${contract.targetCollection}`);
  requireCondition(`${contract.id} has requiredFields`, Array.isArray(contract.requiredFields) && contract.requiredFields.length > 0, "List required target fields.");

  for (const sourceTable of contract.sourceTables ?? []) {
    requireCondition(`${contract.id} source table mapped: ${sourceTable}`, sourceTables.has(sourceTable), `Missing Drizzle table: ${sourceTable}`);
  }
}

for (const collection of requiredImplementedCollections) {
  requireCondition(
    `implemented collection has contract: ${collection}`,
    contracts.some((contract) => contract.targetCollection === collection),
    `Add an import contract for ${collection}.`,
  );
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

console.log(`\nImport contracts: ${contracts.length}`);
console.log("External writes: 0");

if (failed.length > 0) {
  console.error(`\nConvex import contract validation failed: ${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log(`\nConvex import contract validation passed: ${checks.length} checks.`);
