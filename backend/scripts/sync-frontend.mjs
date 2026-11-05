import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(here, '..');
const frontendRoot = path.resolve(here, '../../frontend');
const manifestPath = path.join(backendRoot, '.frontend-sync-manifest.json');
const checkOnly = process.argv.includes('--check');

const copyRoots = ['app', 'components', 'styles', 'public', 'lib'];

const protectedPaths = [
  'app/api/games/',
  'app/api/health/',
  'app/play/[id]/',
  'public/phaser/',
  'public/favicon.ico',
  'lib/games/',
  'lib/game-spec/',
  'lib/services/',
  'lib/supabase/',
  'lib/assets/',
  'lib/images/',
  'lib/play/',
  'lib/http.ts',
  'lib/public-origin.ts',
  'lib/agents/build-spec.ts',
  'lib/agents/designer.ts',
  'lib/agents/grafik.ts',
  'lib/agents/pedagog.ts',
  'lib/agents/pedagog.test.ts',
  'lib/agents/safety.ts',
  'lib/agents/xai.ts',
];

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function isProtected(relativePath) {
  return protectedPaths.some((entry) =>
    entry.endsWith('/') ? relativePath.startsWith(entry) : relativePath === entry,
  );
}

function walk(directory, prefix, files) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory)) {
    if (entry === '.DS_Store' || entry === 'node_modules' || entry === '.next') continue;
    const absolute = path.join(directory, entry);
    const relative = prefix ? `${prefix}/${entry}` : entry;
    if (statSync(absolute).isDirectory()) {
      walk(absolute, relative, files);
      continue;
    }
    files.push(toPosix(relative));
  }
}

function sameFile(source, destination) {
  if (!existsSync(destination)) return false;
  const left = readFileSync(source);
  const right = readFileSync(destination);
  return left.equals(right);
}

function readManifest() {
  if (!existsSync(manifestPath)) return [];
  const parsed = JSON.parse(readFileSync(manifestPath, 'utf8'));
  return Array.isArray(parsed) ? parsed.map(String) : [];
}

if (!existsSync(frontendRoot)) {
  console.log('frontend/ is not in this upload; using the synced copy in backend/.');
  process.exit(0);
}

const discovered = [];
for (const root of copyRoots) {
  walk(path.join(frontendRoot, root), root, discovered);
}
discovered.sort();

const copied = [];
for (const relativePath of discovered) {
  if (isProtected(relativePath)) continue;
  copied.push(relativePath);
}

const previous = readManifest();
const problems = [];

if (checkOnly) {
  const expected = new Set(copied);
  const seen = new Set(previous);
  for (const relativePath of copied) {
    if (!seen.has(relativePath)) problems.push(`missing from manifest: ${relativePath}`);
  }
  for (const relativePath of previous) {
    if (!expected.has(relativePath)) problems.push(`stale manifest entry: ${relativePath}`);
  }
  for (const relativePath of copied) {
    const source = path.join(frontendRoot, relativePath);
    const destination = path.join(backendRoot, relativePath);
    if (!sameFile(source, destination)) problems.push(`out of date: ${relativePath}`);
  }
  if (problems.length > 0) {
    console.error('frontend sync is stale. Run: npm run sync:web');
    for (const problem of problems.slice(0, 30)) console.error(problem);
    process.exit(1);
  }
  console.log(`frontend sync matches (${copied.length} files).`);
  process.exit(0);
}

for (const relativePath of copied) {
  const source = path.join(frontendRoot, relativePath);
  const destination = path.join(backendRoot, relativePath);
  mkdirSync(path.dirname(destination), { recursive: true });
  cpSync(source, destination);
}

const next = new Set(copied);
for (const relativePath of previous) {
  if (next.has(relativePath) || isProtected(relativePath)) continue;
  const destination = path.join(backendRoot, relativePath);
  if (existsSync(destination)) rmSync(destination);
}

writeFileSync(manifestPath, `${JSON.stringify(copied, null, 2)}\n`);
console.log(`Synced frontend into backend (${copied.length} files).`);
