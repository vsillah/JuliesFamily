import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

esbuild.build({
  entryPoints: ['server/vercel-entry.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'api/index.mjs',
  packages: 'external',
  alias: {
    '@db': path.resolve(__dirname, 'shared'),
    '@shared': path.resolve(__dirname, 'shared')
  },
  banner: {
    js: `
import { createRequire } from 'module';
import { fileURLToPath as _fileURLToPath } from 'url';
import { dirname as _dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = _fileURLToPath(import.meta.url);
const __dirname = _dirname(__filename);
    `.trim()
  }
}).catch(() => process.exit(1));
