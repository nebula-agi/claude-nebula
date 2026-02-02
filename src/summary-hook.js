const { NebulaClient } = require('./lib/nebula-client');
const { CollectionManager } = require('./lib/collection-manager');
const { getContainerTag, getProjectName } = require('./lib/container-tag');
const { loadSettings, getApiKey, debugLog } = require('./lib/settings');
const { readStdin, writeOutput } = require('./lib/stdin');
const { formatNewEntries } = require('./lib/transcript-formatter');

async function main() {
  const settings = loadSettings();

  try {
    const input = await readStdin();
    const cwd = input.cwd || process.cwd();
    const sessionId = input.session_id;
    const transcriptPath = input.transcript_path;

    debugLog(settings, 'Stop', { sessionId, transcriptPath });

    if (!transcriptPath || !sessionId) {
      debugLog(settings, 'Missing transcript path or session id');
      writeOutput({ continue: true });
      return;
    }

    let apiKey;
    try {
      apiKey = getApiKey(settings);
    } catch {
      writeOutput({ continue: true });
      return;
    }

    const formatted = formatNewEntries(transcriptPath, sessionId);

    if (!formatted) {
      debugLog(settings, 'No new content to save');
      writeOutput({ continue: true });
      return;
    }

    const client = new NebulaClient(apiKey);
    const collectionManager = new CollectionManager(client);
    const containerTag = getContainerTag(cwd);
    const projectName = getProjectName(cwd);

    // Get or create collection
    const collection = await collectionManager
      .getOrCreateCollection(containerTag, projectName)
      .catch(() => null);

    const collectionId = collection?.id || containerTag;

    await client.addMemory(
      formatted,
      collectionId,
      {
        memory_type: 'conversation',
        type: 'session_turn',
        project: projectName,
        timestamp: new Date().toISOString(),
      },
      sessionId,
    );

    debugLog(settings, 'Session turn saved', { length: formatted.length });
    writeOutput({ continue: true });
  } catch (err) {
    debugLog(settings, 'Error', { error: err.message });
    console.error(`Nebula: ${err.message}`);
    writeOutput({ continue: true });
  }
}

main().catch((err) => {
  console.error(`Nebula fatal: ${err.message}`);
  process.exit(1);
});
