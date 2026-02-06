const { getProjectClient } = require('./lib/nebula');

async function main() {
  const content = process.argv.slice(2).join(' ');

  if (!content?.trim()) {
    console.log('Usage: node add-memory.cjs "content to save"');
    return;
  }

  try {
    const { client, collectionId } = await getProjectClient();

    const result = await client.storeMemory({
      collection_id: collectionId,
      content,
    });

    console.log(`Memory saved. ID: ${result}`);
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
}

main().catch((err) => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
