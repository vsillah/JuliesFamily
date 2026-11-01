import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const lockfile = JSON.parse(readFileSync("package-lock.json", "utf8"));
const docs = readFileSync("docs/phase182-production-convex-deployment.md", "utf8");

const checks = [
  ["Convex dependency is pinned", packageJson.dependencies?.convex === "1.42.1"],
  ["lockfile preserves the pinned Convex dependency", lockfile.packages?.[""].dependencies?.convex === "1.42.1"],
  ["lockfile resolves Convex 1.42.1", lockfile.packages?.["node_modules/convex"]?.version === "1.42.1"],
  ["production deploy script uses the local CLI", packageJson.scripts?.["kinflo:convex-deploy:production"] === "convex deploy --typecheck enable --codegen enable"],
  ["runbook requires dependency installation first", docs.includes("npm ci --ignore-scripts --no-audit --no-fund")],
  ["runbook uses the pinned local CLI", docs.includes("npm run kinflo:convex-deploy:production")],
  ["runbook rejects unpinned npx", !/^npx convex deploy$/m.test(docs)],
  ["runbook keeps the target fixed", docs.includes("clever-viper-68")],
  ["runbook keeps provisioning separate", docs.includes("provisionTenantAndSite")],
];

const failed = checks.filter(([, passed]) => !passed).map(([label]) => label);
if (failed.length > 0) {
  console.error(`Production Convex deployment validation failed: ${failed.join(", ")}`);
  process.exit(1);
}

console.log(`Production Convex deployment validation passed (${checks.length} checks).`);
