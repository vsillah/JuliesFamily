import { execFileSync } from "node:child_process";

const secretLikePaths = [".env", ".env.local", ".env.*.local"];

function runGit(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

function trackedFiles() {
  return runGit(["ls-files"])
    .split("\n")
    .filter(Boolean);
}

function historyEntries() {
  const output = runGit([
    "log",
    "--all",
    "--name-only",
    "--format=commit:%H",
    "--",
    ...secretLikePaths,
  ]);

  const entries = [];
  let currentCommit = null;

  for (const rawLine of output.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (line.startsWith("commit:")) {
      currentCommit = line.slice("commit:".length);
      continue;
    }

    if (currentCommit) {
      entries.push({ commit: currentCommit, path: line });
    }
  }

  return entries;
}

const tracked = trackedFiles();
const trackedSecretFiles = tracked.filter(
  (file) => file === ".env" || file === ".env.local" || file.endsWith(".local"),
);
const historicalEntries = historyEntries();
const uniqueCommits = [...new Set(historicalEntries.map((entry) => entry.commit))];
const uniquePaths = [...new Set(historicalEntries.map((entry) => entry.path))].sort();

console.log("KinFlo secret history audit");
console.log(`Tracked secret-like files: ${trackedSecretFiles.length}`);
console.log(`Historical secret-like path references: ${historicalEntries.length}`);
console.log(`Historical commits with secret-like paths: ${uniqueCommits.length}`);
console.log(`Historical secret-like paths: ${uniquePaths.length > 0 ? uniquePaths.join(", ") : "none"}`);
console.log(`Requires credential rotation review: ${historicalEntries.length > 0 ? "yes" : "no"}`);
console.log(`Requires history purge decision before public/client share: ${historicalEntries.length > 0 ? "yes" : "no"}`);
console.log("Reads historical secret contents: no");
console.log("Prints secret values: no");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Live Convex execution: no");

if (uniqueCommits.length > 0) {
  console.log("\nHistorical path evidence:");
  for (const commit of uniqueCommits) {
    const paths = historicalEntries
      .filter((entry) => entry.commit === commit)
      .map((entry) => entry.path)
      .join(", ");
    console.log(`- ${commit.slice(0, 12)}: ${paths}`);
  }
}

if (trackedSecretFiles.length > 0) {
  console.error(`\nTracked secret-like files must be removed before continuing: ${trackedSecretFiles.join(", ")}`);
  process.exit(1);
}
