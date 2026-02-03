const { createClient, getOrCreateCollection } = require('./lib/nebula');
const { getContainerTag, getProjectName } = require('./lib/container-tag');
const { loadSettings, getApiKey } = require('./lib/settings');

async function main() {
  const query = process.argv.slice(2).join(' ');

  if (!query?.trim()) {
    console.log('Usage: node search-memory.cjs "search query"');
    return;
  }

  const settings = loadSettings();

  let apiKey;
  try {
    apiKey = getApiKey(settings);
  } catch {
    console.log('Nebula API key not configured.');
    console.log('Set NEBULA_API_KEY environment variable.');
    console.log('Get your key at: https://trynebula.ai/settings/api-keys');
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

    const result = await client.search({
      query,
      collection_ids: [collectionId],
    });

    console.log(`## Memory Search: "${query}"`);
    console.log(`Project: ${projectName}\n`);

    const utterances = result.utterances || [];
    if (utterances.length === 0) {
      console.log('No memories found matching your query.');
      console.log('Memories are automatically saved as you work.');
      return;
    }

    console.log('### Relevant Memories\n');
    utterances.forEach((u, i) => {
      const score = Math.round((u.activation_score || 0) * 100);
      const text = u.text || '';
      const role = u.source_role ? `[${u.source_role}] ` : '';
      console.log(`**${i + 1}.** (${score}% match)`);
      console.log(
        `${role}${text.slice(0, 500)}${text.length > 500 ? '...' : ''}\n`,
      );
    });
  } catch (err) {
    console.log(`Error searching memories: ${err.message}`);
  }
}

main().catch((err) => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
