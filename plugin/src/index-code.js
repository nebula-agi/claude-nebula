const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { Memory } = require('@nebula-ai/sdk');
const { getProjectClient } = require('./lib/nebula');

const SKIP_PATTERNS = [
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.min.js',
  '.min.css',
  '.bundle.js',
  '.chunk.js',
  '.md',
];

function shouldSkip(filepath) {
  return SKIP_PATTERNS.some((p) => filepath.includes(p));
}

async function main() {
  const dir = process.argv[2] || process.cwd();
  const absDir = path.resolve(dir);

  console.log(`Indexing code in: ${absDir}`);

  // Get tracked files via git
  let files;
  try {
    const output = execSync('git ls-files', { cwd: absDir, encoding: 'utf8' });
    files = output.trim().split('\n').filter(Boolean);
  } catch {
    console.error('Error: not a git repository or git is not available');
    process.exit(1);
  }

  // Filter files
  const eligible = [];
  for (const relative of files) {
    if (shouldSkip(relative)) continue;

    const absolute = path.join(absDir, relative);
    try {
      const stat = fs.statSync(absolute);
      if (stat.size === 0) continue;
      eligible.push({ relative, absolute, size: stat.size });
    } catch {
      // File may have been deleted but still tracked
      continue;
    }
  }

  console.log(`Found ${eligible.length} files to index (skipped ${files.length - eligible.length})`);

  if (eligible.length === 0) {
    console.log('Nothing to index.');
    return;
  }

  const { client, collectionId } = await getProjectClient();

  let indexed = 0;
  for (const f of eligible) {
    const memory = await Memory.fromFile(f.absolute, collectionId, {
      filepath: f.relative,
      source: 'code-index',
    });
    await client.storeMemory(memory);
    indexed++;
    if (indexed % 10 === 0 || indexed === eligible.length) {
      console.log(`  ${indexed}/${eligible.length} files indexed`);
    }
  }

  console.log(`Done! Indexed ${indexed} files.`);
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
