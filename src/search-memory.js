const { getProjectClient } = require('./lib/nebula');

async function main() {
  const query = process.argv.slice(2).join(' ');

  if (!query?.trim()) {
    console.log('Usage: node search-memory.cjs "search query"');
    return;
  }

  try {
    const { client, collectionId } = await getProjectClient();

    const result = await client.search({
      query,
      collection_ids: [collectionId],
    });

    console.log(JSON.stringify(result));
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
}

main().catch((err) => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
