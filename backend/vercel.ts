import type { VercelConfig } from '@vercel/config/v1';

/**
 * Upload `backend/` as the Vercel project root (the CLI file upload is this directory).
 * `npm run build` vendors the API contract and, when `../frontend` exists, refreshes the UI copy.
 * A backend-only upload uses the committed UI copy. Do not set the Edge runtime.
 */
export const config: VercelConfig = {
  framework: 'nextjs',
  installCommand: 'npm install',
  buildCommand: 'npm run build',
};
