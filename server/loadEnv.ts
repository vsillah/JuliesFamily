/**
 * Load env from: 1) workspace root .env.shared, 2) project .env, 3) .env.local (override).
 * Import this first in any entry point or script so shared API keys are available.
 */
import path from "path";
import { fileURLToPath } from "url";
import { config as dotenvConfig } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..", "..");
dotenvConfig({ path: path.join(workspaceRoot, ".env.shared") });
dotenvConfig();
dotenvConfig({ path: ".env.local", override: true });
