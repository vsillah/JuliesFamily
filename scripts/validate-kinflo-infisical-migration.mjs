import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const packageJson = JSON.parse(read("package.json"));
const wrapper = read("scripts/run-kinflo-with-infisical-env.mjs");
const docs = read("docs/phase181-infisical-migration.md");
const envExample = read(".env.example");
const workflow = read(".github/workflows/validate-infisical-development.yml");

const checks = [
  ["infisical wrapper exists", wrapper.includes('spawnSync("infisical"')],
  ["wrapper uses runtime injection", wrapper.includes('"run"') && wrapper.includes('"--"')],
  ["wrapper has no file writer", !wrapper.includes("writeFile") && !wrapper.includes("appendFile") && !wrapper.includes("mkdir")],
  ["wrapper does not invoke 1Password", !wrapper.includes("op ") && !wrapper.includes("1Password CLI")],
  ["wrapper redacts values", wrapper.includes("Secret values printed: no")],
  ["check script is wired", packageJson.scripts["kinflo:infisical-env-check"]?.includes("--check")],
  ["dev script is wired", packageJson.scripts["kinflo:dev:infisical"]?.includes("npm run dev")],
  ["preflight script is wired", packageJson.scripts["kinflo:activation-preflight:infisical"]?.includes("kinflo:activation-preflight")],
  ["codegen script is wired", packageJson.scripts["kinflo:convex-codegen:infisical"]?.includes("convex:codegen")],
  ["environment contract is documented", envExample.includes("INFISICAL_PROJECT_ID") && envExample.includes("INFISICAL_ENV")],
  ["migration docs exist", docs.includes("Phase 181") && docs.includes("source-only")],
  ["docs preserve 1Password rollback", docs.includes("1Password") && docs.includes("rollback")],
  ["docs prohibit external writes", docs.toLowerCase().includes("no infisical secret creation") && docs.includes("Vercel change")],
  ["OIDC validation workflow exists", workflow.includes("Infisical/secrets-action@d2e351f16c6ca20d17c85e6c992e04bdeb64e87d")],
  ["workflow is manual and development-only", workflow.includes("workflow_dispatch") && workflow.includes("INFISICAL_ENV: dev") && workflow.includes("INFISICAL_PATH: /convex")],
  ["workflow requires non-secret bindings", workflow.includes("INFISICAL_PROJECT_ID") && workflow.includes("INFISICAL_DEV_IDENTITY_ID")],
  ["workflow grants OIDC only", workflow.includes("id-token: write") && !workflow.includes("secrets.INFISICAL")],
  ["workflow performs no deployment", workflow.includes("Deployment attempts: \\\`0\\\`") && !workflow.includes("convex deploy")],
  ["workflow preserves environment-file policy", workflow.includes(".env.local must remain absent")],
];

const failures = checks.filter(([, passed]) => !passed).map(([label]) => label);
if (failures.length > 0) {
  console.error(`KinFlo Infisical migration validation failed: ${failures.join(", ")}`);
  process.exit(1);
}

console.log(`KinFlo Infisical migration validation passed: ${checks.length} checks`);
