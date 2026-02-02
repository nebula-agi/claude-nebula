const { NebulaClient } = require('./lib/nebula-client');
const { CollectionManager } = require('./lib/collection-manager');
const { getContainerTag, getProjectName } = require('./lib/container-tag');
const { loadSettings, getApiKey } = require('./lib/settings');

async function main() {
  const content = process.argv.slice(2).join(' ');

  if (!content || !content.trim()) {
    console.log(
      'No content provided. Usage: node add-memory.cjs "content to save"',
    );
    return;
  }

  const settings = loadSettings();

  let apiKey;
  try {
    apiKey = getApiKey(settings);
  } catch {
    console.log('Nebula API key not configured.');
    console.log('Set NEBULA_API_KEY environment variable.');
    return;
  }

  const cwd = process.cwd();
  const containerTag = getContainerTag(cwd);
  const projectName = getProjectName(cwd);

  try {
    const client = new NebulaClient(apiKey);
    const collectionManager = new CollectionManager(client);

    // Get or create collection
    const collection = await collectionManager
      .getOrCreateCollection(containerTag, projectName)
      .catch(() => null);

    const collectionId = collection?.id || containerTag;

    const result = await client.addMemory(content, collectionId, {
      memory_type: 'conversation',
      type: 'manual',
      project: projectName,
      timestamp: new Date().toISOString(),
    });

    console.log(`Memory saved to project: ${projectName}`);
    console.log(`ID: ${result.id}`);
  } catch (err) {
    console.log(`Error saving memory: ${err.message}`);
  }
}

main().catch((err) => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
