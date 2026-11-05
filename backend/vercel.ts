import type { VercelConfig } from '@vercel/config/v1';

/**
 * Used when the Vercel project's Root Directory is `backend`.
 * Node.js on Fluid Compute is the default runtime. Do not set `runtime: "edge"`.
 * See the repo README for the monorepo setting that also uploads `packages/api-contract`.
 */
export const config: VercelConfig = {
  framework: 'nextjs',
  installCommand: 'npm install',
  buildCommand: 'npm run build',
};
