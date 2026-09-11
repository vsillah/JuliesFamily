import { execFileSync, spawnSync } from "node:child_process";

const REQUIRED_KEYS = [
  "CONVEX_DEPLOYMENT",
  "VITE_CONVEX_URL",
  "CONVEX_AUTH_ISSUER",
  "CONVEX_AUTH_CLIENT_ID",
];

const FIELD_ALIASES = {
  CONVEX_DEPLOYMENT: ["CONVEX_DEPLOYMENT", "convex deployment", "deployment"],
  VITE_CONVEX_URL: ["VITE_CONVEX_URL", "convex url", "public convex url", "url"],
  CONVEX_AUTH_ISSUER: ["CONVEX_AUTH_ISSUER", "auth issuer", "issuer"],
  CONVEX_AUTH_CLIENT_ID: ["CONVEX_AUTH_CLIENT_ID", "auth client id", "client id"],
};

function printUsage() {
  console.log(`KinFlo 1Password env runner

Usage:
  OP_KINFLO_CONVEX_ITEM="item name or uuid" npm run kinflo:activation-preflight:1password
  OP_KINFLO_CONVEX_ITEM="item name or uuid" npm run kinflo:convex-codegen:1password
  OP_KINFLO_CONVEX_ITEM="item name or uuid" npm run kinflo:1password-env-check

Optional direct secret references:
  OP_KINFLO_CONVEX_DEPLOYMENT_REF
  OP_KINFLO_VITE_CONVEX_URL_REF
  OP_KINFLO_CONVEX_AUTH_ISSUER_REF
  OP_KINFLO_CONVEX_AUTH_CLIENT_ID_REF

The runner injects values into the child process only. It never prints secret values.`);
}

function readOp(args, options = {}) {
  return execFileSync("op", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim();
}

function requireSignedIn() {
  try {
    readOp(["whoami"]);
  } catch {
    throw new Error("1Password CLI is not signed in in this terminal. Run `op signin` from the terminal that will execute this script.");
  }
}

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function findFieldValue(fields, key) {
  const aliases = new Set(FIELD_ALIASES[key].map(normalize));
  const field = fields.find((candidate) => {
    const names = [candidate.id, candidate.label, candidate.type, candidate.purpose].map(normalize);
    return names.some((name) => aliases.has(name));
  });

  if (!field?.value) {
    return undefined;
  }

  return String(field.value).trim();
}

function readRefs() {
  const refEnv = {
    CONVEX_DEPLOYMENT: process.env.OP_KINFLO_CONVEX_DEPLOYMENT_REF,
    VITE_CONVEX_URL: process.env.OP_KINFLO_VITE_CONVEX_URL_REF,
    CONVEX_AUTH_ISSUER: process.env.OP_KINFLO_CONVEX_AUTH_ISSUER_REF,
    CONVEX_AUTH_CLIENT_ID: process.env.OP_KINFLO_CONVEX_AUTH_CLIENT_ID_REF,
  };

  if (!Object.values(refEnv).some(Boolean)) {
    return {};
  }

  const values = {};
  for (const key of REQUIRED_KEYS) {
    const ref = refEnv[key];
    if (!ref) {
      continue;
    }
    values[key] = readOp(["read", ref]);
  }
  return values;
}

function readItem() {
  const item = process.env.OP_KINFLO_CONVEX_ITEM;
  if (!item) {
    return {};
  }

  const raw = readOp(["item", "get", item, "--format", "json"]);
  const parsed = JSON.parse(raw);
  const fields = Array.isArray(parsed.fields) ? parsed.fields : [];
  const values = {};

  for (const key of REQUIRED_KEYS) {
    const value = findFieldValue(fields, key);
    if (value) {
      values[key] = value;
    }
  }

  return values;
}

function collectValues() {
  requireSignedIn();
  return {
    ...readItem(),
    ...readRefs(),
  };
}

function assertComplete(values) {
  const missing = REQUIRED_KEYS.filter((key) => !values[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required 1Password-backed env keys: ${missing.join(", ")}`);
  }
}

function printPresence(values) {
  console.log("KinFlo 1Password env check");
  for (const key of REQUIRED_KEYS) {
    console.log(`${key}: ${values[key] ? "present" : "missing"}`);
  }
  console.log("Secret values printed: no");
  console.log(".env.local written: no");
}

const args = process.argv.slice(2);

try {
  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    process.exit(0);
  }

  const commandSeparatorIndex = args.indexOf("--");
  const command = commandSeparatorIndex === -1 ? [] : args.slice(commandSeparatorIndex + 1);
  const checkOnly = args.includes("--check") || command.length === 0;
  const values = collectValues();

  assertComplete(values);
  printPresence(values);

  if (checkOnly) {
    process.exit(0);
  }

  const result = spawnSync(command[0], command.slice(1), {
    stdio: "inherit",
    env: {
      ...process.env,
      ...values,
    },
  });

  process.exit(result.status ?? 1);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error("Secret values printed: no");
  console.error(".env.local written: no");
  process.exit(1);
}
