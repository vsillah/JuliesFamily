import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { execFileSync } from "node:child_process";

const sourceExtensions = new Set([".cjs", ".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const ignoredDirectories = new Set([
  ".git",
  ".next",
  ".turbo",
  "coverage",
  "dist",
  "node_modules",
]);

const secretFileNames = new Set([".env", ".env.local"]);
const builtInEnvKeys = new Set(["DEV", "PROD"]);

const envPatterns = [
  /process\.env\.([A-Z][A-Z0-9_]*)/g,
  /process\.env\[['"`]([A-Z][A-Z0-9_]*)['"`]\]/g,
  /import\.meta\.env\.([A-Z][A-Z0-9_]*)/g,
  /import\.meta\.env\[['"`]([A-Z][A-Z0-9_]*)['"`]\]/g,
];

function gitTrackedFiles() {
  return execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
}

function walk(directory, files = []) {
  for (const entry of readdirSync(directory)) {
    if (ignoredDirectories.has(entry)) {
      continue;
    }

    const path = join(directory, entry);
    const stats = statSync(path);

    if (stats.isDirectory()) {
      walk(path, files);
      continue;
    }

    if (sourceExtensions.has(extname(entry))) {
      files.push(path);
    }
  }

  return files;
}

function readEnvExampleKeys(path = ".env.example") {
  if (!existsSync(path)) {
    return new Set();
  }

  const keys = new Set();
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const directMatch = trimmed.match(/^([A-Z][A-Z0-9_]*)=/);
    if (directMatch) {
      keys.add(directMatch[1]);
      continue;
    }

    for (const match of trimmed.matchAll(/\b([A-Z][A-Z0-9_]*)=/g)) {
      keys.add(match[1]);
    }
  }

  return keys;
}

function collectSourceEnvKeys() {
  const references = new Map();

  for (const file of walk(".")) {
    const content = readFileSync(file, "utf8");
    const lines = content.split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      for (const pattern of envPatterns) {
        pattern.lastIndex = 0;
        for (const match of line.matchAll(pattern)) {
          const key = match[1];
          const locations = references.get(key) ?? [];
          locations.push(`${file.replace(/^\.\//, "")}:${index + 1}`);
          references.set(key, locations);
        }
      }
    }
  }

  return references;
}

const tracked = gitTrackedFiles();
const trackedSecretFiles = tracked.filter(
  (file) => secretFileNames.has(file) || file.endsWith(".local"),
);
const generatedConvexFiles = tracked.filter((file) => file.startsWith("convex/_generated/"));
const envExampleKeys = readEnvExampleKeys();
const sourceReferences = collectSourceEnvKeys();
const sourceKeys = [...sourceReferences.keys()].filter((key) => !builtInEnvKeys.has(key)).sort();
const documentedKeys = sourceKeys.filter((key) => envExampleKeys.has(key));
const undocumentedKeys = sourceKeys.filter((key) => !envExampleKeys.has(key));
const unusedExampleKeys = [...envExampleKeys].filter((key) => !sourceReferences.has(key)).sort();

console.log("KinFlo environment inventory");
console.log(`Source env keys referenced: ${sourceKeys.length}`);
console.log(`Documented in .env.example: ${documentedKeys.length}`);
console.log(`Referenced but missing from .env.example: ${undocumentedKeys.length}`);
console.log(`Listed in .env.example but not directly referenced in source: ${unusedExampleKeys.length}`);
console.log(`Tracked secret-like files: ${trackedSecretFiles.length}`);
console.log(`Tracked generated Convex files: ${generatedConvexFiles.length}`);
console.log("Reads local secret files: no");
console.log("Prints secret values: no");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Live Convex execution: no");

if (sourceKeys.length > 0) {
  console.log("\nReferenced keys:");
  for (const key of sourceKeys) {
    const locations = sourceReferences.get(key) ?? [];
    const locationPreview = locations.slice(0, 3).join(", ");
    const extra = locations.length > 3 ? `, +${locations.length - 3} more` : "";
    const status = envExampleKeys.has(key) ? "documented" : "missing .env.example";
    console.log(`- ${key}: ${status}; ${locationPreview}${extra}`);
  }
}

if (unusedExampleKeys.length > 0) {
  console.log("\n.env.example keys not directly referenced in scanned source:");
  for (const key of unusedExampleKeys) {
    console.log(`- ${key}`);
  }
}

if (trackedSecretFiles.length > 0) {
  console.error(`\nTracked secret-like files must be removed: ${trackedSecretFiles.join(", ")}`);
  process.exit(1);
}

if (generatedConvexFiles.length > 0) {
  console.error(`\nGenerated Convex files must remain untracked until hosted setup is approved: ${generatedConvexFiles.join(", ")}`);
  process.exit(1);
}

if (undocumentedKeys.length > 0) {
  console.error(`\nReferenced env keys missing from .env.example: ${undocumentedKeys.join(", ")}`);
  process.exit(1);
}
