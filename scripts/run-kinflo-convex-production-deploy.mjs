import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const runnerPath = resolve("scripts/run-kinflo-convex-cli.mjs");
const result = spawnSync(
  process.execPath,
  [runnerPath, "deploy", "--typecheck", "enable", "--codegen", "enable"],
  { stdio: "inherit", env: process.env },
);

process.exit(result.status ?? 1);
