import type { VercelConfig } from '@vercel/config/v1';

/**
 * Vercel project Root Directory must be `backend`.
 * Install and build run in that directory. The API contract is vendored, so the
 * deploy does not need npm workspaces or files outside `backend/`.
 * Node.js on Fluid Compute is the default. Do not set the Edge runtime.
 */
export const config: VercelConfig = {
  framework: 'nextjs',
  installCommand: 'npm install',
  buildCommand: 'npm run build',
};
