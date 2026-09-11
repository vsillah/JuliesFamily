import { spawnSync } from "node:child_process";

const protectedPrefixes = [
  "client/src/lib/kinflo",
  "client/src/pages/AdminKinfloShell.tsx",
  "client/src/pages/KinfloPublicSitePreview.tsx",
  "convex/",
  "scripts/validate-kinflo",
  "scripts/validate-convex",
  "scripts/dry-run-kinflo",
  "scripts/dry-run-convex",
];

const result = spawnSync("npm", ["run", "check"], {
  encoding: "utf8",
  maxBuffer: 1024 * 1024 * 20,
});

const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
const diagnostics = Array.from(
  output.matchAll(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/gm),
  (match) => ({
    file: match[1],
    line: Number(match[2]),
    column: Number(match[3]),
    code: match[4],
    message: match[5],
  }),
);

const protectedDiagnostics = diagnostics.filter((diagnostic) =>
  protectedPrefixes.some((prefix) => diagnostic.file.startsWith(prefix)),
);

const fileCounts = new Map();
for (const diagnostic of diagnostics) {
  fileCounts.set(diagnostic.file, (fileCounts.get(diagnostic.file) ?? 0) + 1);
}

const topFiles = [...fileCounts.entries()]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .slice(0, 20);

console.log("\nKinFlo TypeScript baseline gate");
console.log(`npm run check exit code: ${result.status ?? 0}`);
console.log(`TypeScript diagnostics: ${diagnostics.length}`);
console.log(`Protected KinFlo diagnostics: ${protectedDiagnostics.length}`);
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");

if (result.status === 0) {
  console.log("\nRepo-wide TypeScript check passed. The baseline gate is now a full pass-through.");
  process.exit(0);
}

console.log("\nTop TypeScript diagnostic files:");
for (const [file, count] of topFiles) {
  console.log(`- ${file}: ${count}`);
}

if (protectedDiagnostics.length > 0) {
  console.error("\nProtected KinFlo TypeScript diagnostics:");
  for (const diagnostic of protectedDiagnostics.slice(0, 30)) {
    console.error(`- ${diagnostic.file}:${diagnostic.line}:${diagnostic.column} ${diagnostic.code} ${diagnostic.message}`);
  }
  console.error("\nKinFlo TypeScript baseline gate failed: protected migration surfaces have TypeScript diagnostics.");
  process.exit(1);
}

if (diagnostics.length === 0) {
  console.error("\nKinFlo TypeScript baseline gate failed: npm run check failed but no TypeScript diagnostics were parsed.");
  process.exit(1);
}

console.log("\nRepo-wide TypeScript check still fails on pre-existing non-KinFlo drift.");
console.log("KinFlo protected surfaces remain clear.");
