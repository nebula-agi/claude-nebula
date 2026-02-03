const { Nebula } = require('@nebula-ai/sdk');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const COLLECTIONS_FILE = path.join(
  os.homedir(),
  '.nebula-claude',
  'collections.json',
);

/**
 * Get or create a Nebula client instance.
 */
function createClient(apiKey) {
  if (!apiKey) throw new Error('NEBULA_API_KEY is required');
  return new Nebula({ apiKey });
}

/**
 * Get or create a collection for a project.
 * Caches collection IDs locally to avoid repeated API calls.
 */
async function getOrCreateCollection(client, containerTag, projectName) {
  // Check cache first
  const cache = loadCollectionCache();
  if (cache[containerTag]) {
    return cache[containerTag];
  }

  // Create collection with project name
  const name = projectName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();

  try {
    const result = await client.createCollection({ name });
    const collectionId = result.id;

    // Cache the result
    cache[containerTag] = collectionId;
    saveCollectionCache(cache);

    return collectionId;
  } catch (err) {
    // If already exists, fetch it by name to get the actual UUID
    if (err.message?.includes('409') || err.message?.includes('exists')) {
      try {
        const collection = await client.getCollectionByName(name);
        const collectionId = collection.id;
        cache[containerTag] = collectionId;
        saveCollectionCache(cache);
        return collectionId;
      } catch (getErr) {
        // Fallback: return the name if we can't fetch it
        // This maintains backwards compatibility with cache entries
        cache[containerTag] = name;
        saveCollectionCache(cache);
        return name;
      }
    }
    throw err;
  }
}

function loadCollectionCache() {
  try {
    if (fs.existsSync(COLLECTIONS_FILE)) {
      return JSON.parse(fs.readFileSync(COLLECTIONS_FILE, 'utf-8'));
    }
  } catch {}
  return {};
}

function saveCollectionCache(cache) {
  const dir = path.dirname(COLLECTIONS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(COLLECTIONS_FILE, JSON.stringify(cache, null, 2));
}

/**
 * Format search results into context for Claude.
 */
function formatSearchContext(searchResult, maxItems = 5) {
  const utterances = searchResult.utterances || [];

  if (utterances.length === 0) {
    return null;
  }

  const items = utterances.slice(0, maxItems).map((u) => {
    const text = u.text || '';
    const score = Math.round((u.activation_score || 0) * 100);
    return `- ${text.slice(0, 200)}${text.length > 200 ? '...' : ''} [${score}%]`;
  });

  return `<nebula-context>
Relevant memories from previous sessions:

${items.join('\n')}

Use these memories naturally when relevant.
</nebula-context>`;
}

module.exports = {
  createClient,
  getOrCreateCollection,
  formatSearchContext,
};
