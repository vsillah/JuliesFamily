import { spawnSync } from "node:child_process";

const DEFAULT_ENVIRONMENT = "dev";
const DEFAULT_PATH = "/";

function printUsage() {
  console.log(`KinFlo Infisical env runner

Usage:
  npm run kinflo:infisical-env-check
  npm run kinflo:dev:infisical
  npm run kinflo:activation-preflight:infisical
  npm run kinflo:convex-codegen:infisical

Configuration (non-secret values only):
  INFISICAL_PROJECT_ID   Required for machine-identity access; optional with .infisical.json.
  INFISICAL_ENV          Infisical environment, default: dev.
  INFISICAL_PATH         Infisical path, default: /.
  INFISICAL_API_URL      Optional Infisical API URL for non-US Cloud or self-hosted use.

The runner injects secrets into the child process only. It never writes .env.local,
prints secret values, or changes the existing 1Password runner.`);
}

function readConfiguration() {
  const projectId = process.env.INFISICAL_PROJECT_ID?.trim();
  const environment = process.env.INFISICAL_ENV?.trim() || DEFAULT_ENVIRONMENT;
  const secretPath = process.env.INFISICAL_PATH?.trim() || DEFAULT_PATH;
  const apiUrl = process.env.INFISICAL_API_URL?.trim();

  if (!/^[a-zA-Z0-9._-]+$/.test(environment)) {
    throw new Error("INFISICAL_ENV must contain only letters, numbers, dots, underscores, or hyphens");
  }

  if (!secretPath.startsWith("/")) {
    throw new Error("INFISICAL_PATH must start with /");
  }

  if (apiUrl && !/^https:\/\//.test(apiUrl)) {
    throw new Error("INFISICAL_API_URL must use HTTPS");
  }

  return { projectId, environment, secretPath, apiUrl };
}

function hasInfisicalCli() {
  const result = spawnSync("infisical", ["--version"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return result.status === 0;
}

function buildArgs(configuration, command) {
  const args = [
    "run",
    "--silent",
    `--env=${configuration.environment}`,
    `--path=${configuration.secretPath}`,
  ];

  if (configuration.projectId) {
    args.push(`--projectId=${configuration.projectId}`);
  }

  if (configuration.apiUrl) {
    args.push(`--domain=${configuration.apiUrl}`);
  }

  args.push("--", ...command);
  return args;
}

const args = process.argv.slice(2);

try {
  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const separatorIndex = args.indexOf("--");
  const command = separatorIndex === -1 ? [] : args.slice(separatorIndex + 1);
  const configuration = readConfiguration();

  if (!hasInfisicalCli()) {
    throw new Error("Infisical CLI is unavailable. Install it and authenticate with `infisical login` before running this command.");
  }

  if (args.includes("--check") || command.length === 0) {
    console.log("KinFlo Infisical env contract");
    console.log(`INFISICAL_PROJECT_ID: ${configuration.projectId ? "configured" : "not configured"}`);
    console.log(`INFISICAL_ENV: ${configuration.environment}`);
    console.log(`INFISICAL_PATH: ${configuration.secretPath}`);
    console.log(`INFISICAL_API_URL: ${configuration.apiUrl ? "configured" : "default"}`);
    console.log("Secret values printed: no");
    console.log(".env.local written: no");
    console.log("1Password records changed: no");
    process.exit(0);
  }

  const result = spawnSync("infisical", buildArgs(configuration, command), {
    stdio: "inherit",
    env: process.env,
  });

  process.exit(result.status ?? 1);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error("Secret values printed: no");
  console.error(".env.local written: no");
  console.error("1Password records changed: no");
  process.exit(1);
}
