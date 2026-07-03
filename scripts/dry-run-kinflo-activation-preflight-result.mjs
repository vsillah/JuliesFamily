import { readFileSync } from "node:fs";

const templatePath = "docs/convex-activation-preflight-result-template.json";
const template = JSON.parse(readFileSync(templatePath, "utf8"));

console.log("KinFlo activation preflight sanitized result template");
console.log(`Template: ${templatePath}`);
console.log(`Status: ${template.status}`);
console.log(`Admin route: ${template.adminRoute}`);
console.log(`Fields: ${template.resultFields.length}`);
console.log("");
console.log("Allowed committed fields:");
for (const field of template.resultFields) {
  console.log(`- ${field.id}: ${field.allowedShape}; sanitized example: ${field.sanitizedValueExample}`);
}
console.log("");
console.log("Commit rules:");
for (const rule of template.commitRules) {
  console.log(`- ${rule}`);
}
console.log("");
console.log("Provider boundary:");
console.log("Hosted deployment created: no");
console.log("Hosted env values entered: no");
console.log("Hosted env values read or printed: no");
console.log("Activation preflight against real env: no");
console.log("Raw preflight logs committed: no");
console.log("Convex codegen run: no");
console.log("Generated API imported: no");
console.log("Live Convex execution: no");
console.log("Provider writes: 0");
console.log("Hosted preflight result recorded: no");
