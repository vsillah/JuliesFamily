import { spawn } from 'child_process';

const child = spawn('npm', ['run', 'db:push', '--', '--force'], {
  stdio: ['pipe', 'inherit', 'inherit']
});

// Send newline (Enter) every 2 seconds to accept default options
const interval = setInterval(() => {
  child.stdin.write('\n');
}, 2000);

child.on('close', (code) => {
  clearInterval(interval);
  process.exit(code);
});

// Timeout after 2 minutes
setTimeout(() => {
  clearInterval(interval);
  child.kill();
  console.error('Timeout: drizzle-kit took too long');
  process.exit(1);
}, 120000);
