const { getProjectClient } = require('./lib/nebula');

async function main() {
  const text = process.argv.slice(2).join(' ');
  if (!text?.trim()) {
    console.log('Usage: add-memory.cjs "text to store"');
    return;
  }

  const { client, collectionId } = await getProjectClient();
  await client.storeMemories([{ collection_id: collectionId, content: text }]);
  console.log('Memory stored.');
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
