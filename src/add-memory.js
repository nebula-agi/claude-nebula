const { createClient, getOrCreateCollection } = require('./lib/nebula');
const { getContainerTag, getProjectName } = require('./lib/container-tag');
const { loadSettings, getApiKey } = require('./lib/settings');

async function main() {
  const content = process.argv.slice(2).join(' ');

  if (!content?.trim()) {
    console.log('Usage: node add-memory.cjs "content to save"');
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
    const client = createClient(apiKey);
    const collectionId = await getOrCreateCollection(
      client,
      containerTag,
      projectName,
    ).catch(() => containerTag);

    const result = await client.storeMemory({
      collection_id: collectionId,
      content,
      metadata: { project: projectName, type: 'manual' },
    });

    console.log(`Memory saved to project: ${projectName}`);
    console.log(`ID: ${result}`);
  } catch (err) {
    console.log(`Error saving memory: ${err.message}`);
  }
}

main().catch((err) => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
