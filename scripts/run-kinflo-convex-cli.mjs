import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const expectedVersion = "1.42.1";
const packagePath = resolve("node_modules/convex/package.json");
const cliPath = resolve("node_modules/convex/bin/main.js");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const args = process.argv.slice(2);

function runNpmExec(cliArgs) {
  return spawnSync(npmCommand, [
    "exec",
    "--yes",
    "--package",
    `convex@${expectedVersion}`,
    "--",
    "convex",
    ...cliArgs,
  ], {
    stdio: "inherit",
    env: process.env,
  });
}

if (!existsSync(packagePath) || !existsSync(cliPath)) {
  const result = runNpmExec(["--version"]);
  if (result.error || result.status !== 0) {
    console.error(`Pinned Convex CLI preflight failed: ${result.error?.message ?? "npm exec could not resolve the pinned package."}`);
    process.exit(result.error ? 1 : result.status ?? 1);
  }

  console.log(`Pinned Convex CLI preflight passed via npm exec: ${expectedVersion}`);
  if (args.includes("--preflight")) {
    process.exit(0);
  }

  const fallbackResult = runNpmExec(args);
  process.exit(fallbackResult.error ? 1 : fallbackResult.status ?? 1);
}

const installedPackage = JSON.parse(readFileSync(packagePath, "utf8"));
if (installedPackage.version !== expectedVersion) {
  console.error(`Pinned Convex CLI preflight failed: expected ${expectedVersion}.`);
  process.exit(1);
}

console.log(`Pinned Convex CLI preflight passed: ${expectedVersion}`);

if (process.argv.includes("--preflight")) {
  process.exit(0);
}

const result = spawnSync(process.execPath, [cliPath, ...args], {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
