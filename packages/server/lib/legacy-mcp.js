import { spawn } from 'node:child_process';

import { PRODUCT_IDENTITY } from './product-identity.js';

export const legacyMcpRemovalArgs = ['--yes', 'add-mcp@latest', 'remove', PRODUCT_IDENTITY.mcpConfigKey, '--global', '--yes'];

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'inherit', 'inherit'] });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`add-mcp could not remove the legacy MCP registration (${signal || `exit ${code}`}). Retry with: npx ${legacyMcpRemovalArgs.join(' ')}`));
    });
  });
}

export async function removeLegacyMcpRegistration({ execute = run } = {}) {
  await execute(process.platform === 'win32' ? 'npx.cmd' : 'npx', legacyMcpRemovalArgs);
}
