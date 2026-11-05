import { cpSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(here, '../../packages/api-contract');
const destination = path.resolve(here, '../vendor/api-contract');

if (!existsSync(source)) {
  console.log('packages/api-contract is not in this upload; using the vendored copy.');
  process.exit(0);
}

rmSync(destination, { recursive: true, force: true });
cpSync(source, destination, {
  recursive: true,
  filter: (entry) => !entry.includes(`${path.sep}node_modules`),
});
console.log('Vendored packages/api-contract into backend/vendor/api-contract.');
