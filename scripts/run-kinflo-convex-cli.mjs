import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const expectedVersion = "1.42.1";
const packagePath = resolve("node_modules/convex/package.json");
const cliPath = resolve("node_modules/convex/bin/main.js");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const args = process.argv.slice(2);

function runNpmInstall() {
  return spawnSync(npmCommand, [
    "install",
    "--no-save",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    "--package-lock=false",
    `convex@${expectedVersion}`,
  ], {
    stdio: "inherit",
    env: process.env,
  });
}

function resolveServerModule() {
  try {
    const requireFromProject = createRequire(resolve(process.cwd(), "package.json"));
    requireFromProject.resolve("convex/server");
    return true;
  } catch {
    return false;
  }
}

function ensureLocalCli() {
  if (!existsSync(packagePath) || !existsSync(cliPath) || !resolveServerModule()) {
    console.log(`Convex ${expectedVersion} is not fully materialized after npm ci; installing the pinned package locally.`);
    const result = runNpmInstall();
    if (result.error || result.status !== 0) {
      console.error(`Pinned Convex CLI materialization failed: ${result.error?.message ?? "npm install could not resolve the pinned package."}`);
      process.exit(result.error ? 1 : result.status ?? 1);
    }
  }

  if (!existsSync(packagePath) || !existsSync(cliPath) || !resolveServerModule()) {
    console.error("Pinned Convex CLI preflight failed: convex/server is not resolvable from the project checkout.");
    process.exit(1);
  }
}

ensureLocalCli();

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
