import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const manifestPath = "docs/convex-import-contracts/import-manifest.json";

execFileSync("node", ["scripts/validate-convex-import-contracts.mjs"], {
  stdio: "inherit",
});

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const contracts = manifest.contracts ?? [];
const phaseCounts = new Map();

for (const contract of contracts) {
  phaseCounts.set(contract.phase, (phaseCounts.get(contract.phase) ?? 0) + 1);
}

console.log("\nKinFlo Convex import dry run");
console.log(`Manifest: ${manifestPath}`);
console.log(`Contracts: ${contracts.length}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");

for (const [phase, count] of [...phaseCounts.entries()].sort((a, b) => a[0] - b[0])) {
  console.log(`Phase ${phase}: ${count} contract(s)`);
}

console.log("\nPlanned target collections:");
for (const contract of contracts) {
  const source = contract.sourceTables.length > 0
    ? contract.sourceTables.join(", ")
    : "seeded/no legacy source";
  console.log(`- ${contract.targetCollection}: ${contract.operation} from ${source}`);
}
