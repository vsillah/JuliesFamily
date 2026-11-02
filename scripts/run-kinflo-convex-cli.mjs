import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const expectedVersion = "1.42.1";
const packagePath = resolve("node_modules/convex/package.json");
const cliPath = resolve("node_modules/convex/bin/main.js");

if (!existsSync(packagePath) || !existsSync(cliPath)) {
  console.error("Pinned Convex CLI preflight failed: run npm ci before invoking Convex.");
  process.exit(1);
}

const installedPackage = JSON.parse(readFileSync(packagePath, "utf8"));
if (installedPackage.version !== expectedVersion) {
  console.error(`Pinned Convex CLI preflight failed: expected ${expectedVersion}.`);
  process.exit(1);
}

console.log(`Pinned Convex CLI preflight passed: ${expectedVersion}`);

const args = process.argv.slice(2);
if (process.argv.includes("--preflight")) {
  process.exit(0);
}

const result = spawnSync(process.execPath, [cliPath, ...args], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
