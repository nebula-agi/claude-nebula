const { getProjectClient } = require('./lib/nebula');

async function main() {
  const query = process.argv.slice(2).join(' ');
  if (!query?.trim()) {
    console.log('Usage: search-memory.cjs "query"');
    return;
  }

  const { client, collectionId } = await getProjectClient();
  const result = await client.search({ query, collection_ids: [collectionId] });
  const utterances = result.utterances || [];

  if (utterances.length === 0) {
    console.log('No memories found.');
    return;
  }

  for (const [i, u] of utterances.entries()) {
    const score = Math.round((u.activation_score || 0) * 100);
    const role = u.source_role ? `[${u.source_role}] ` : '';
    console.log(`**${i + 1}.** (${score}% match)`);
    console.log(`${role}${u.text || ''}\n`);
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
