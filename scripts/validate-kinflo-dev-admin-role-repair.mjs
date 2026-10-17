import fs from "node:fs";

const controlPlane = fs.readFileSync("convex/controlPlane.ts", "utf8");
const adminRoute = fs.readFileSync("client/src/components/KinfloAdminRoute.tsx", "utf8");
const runtime = fs.readFileSync("client/src/lib/kinfloIdentityRuntime.ts", "utf8");

const checks = [
  [controlPlane.includes('export const repairCurrentPlatformAdmin = mutation({'), "repair mutation exists"],
  [controlPlane.includes('process.env.KINFLO_DEV_ADMIN_REPAIR_ENABLED !== "true"'), "mutation is dev-flag gated"],
  [controlPlane.includes('const user = await syncCurrentUser(ctx);'), "mutation resolves the authenticated identity"],
  [controlPlane.includes('ctx.db.patch(user._id'), "mutation patches only the current user"],
  [!controlPlane.includes('args: { userId:'), "mutation does not accept a user id"],
  [adminRoute.includes('controlPlane:repairCurrentPlatformAdmin'), "admin route calls the repair mutation"],
  [adminRoute.includes('button-kinflo-repair-platform-admin'), "admin route exposes an explicit repair control"],
  [runtime.includes('KINFLO_APPROVED_DEV_ACTIVATION_DEPLOYMENT = "hallowed-manatee-765"'), "approved dev target is explicit"],
  [runtime.includes('hostname.endsWith(".convex.cloud")'), "Convex cloud hostname is required"],
  [runtime.includes('hostname.endsWith(".convex.site")'), "Convex site hostname is required"],
];

for (const [passed, label] of checks) {
  if (!passed) {
    throw new Error(`failed: ${label}`);
  }
  console.log(`passed: ${label}`);
}

console.log(`KinFlo dev admin role repair validation passed: ${checks.length} checks.`);
