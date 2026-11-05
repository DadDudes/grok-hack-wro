import type { VercelConfig } from '@vercel/config/v1';

/**
 * Vercel project Root Directory must be `backend`.
 * Install and build are anchored at the git root so `packages/api-contract`
 * resolves whether Vercel runs the command in the repo root or in `backend/`.
 * Keep "Include source files outside of the Root Directory" enabled.
 * Node.js on Fluid Compute is the default. Do not set the Edge runtime.
 */
const repoRoot = '"$(git rev-parse --show-toplevel)"';

export const config: VercelConfig = {
  framework: 'nextjs',
  installCommand: `npm install --prefix ${repoRoot} --workspace=@grok-hack/api`,
  buildCommand: `npm run build --prefix ${repoRoot} --workspace=@grok-hack/api`,
};
