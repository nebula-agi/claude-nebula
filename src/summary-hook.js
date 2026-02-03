const { createClient, getOrCreateCollection } = require('./lib/nebula');
const { getContainerTag, getProjectName } = require('./lib/container-tag');
const { loadSettings, getApiKey, debugLog } = require('./lib/settings');
const { readStdin, writeOutput } = require('./lib/stdin');
const { extractNewMessages } = require('./lib/transcript-formatter');

async function main() {
  const settings = loadSettings();

  try {
    const input = await readStdin();
    const cwd = input.cwd || process.cwd();
    const { session_id: sessionId, transcript_path: transcriptPath } = input;

    debugLog(settings, 'Stop', { sessionId, transcriptPath });

    if (!transcriptPath || !sessionId) {
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

    const extracted = extractNewMessages(transcriptPath, sessionId);
    if (!extracted) {
      debugLog(settings, 'No new content to save');
      writeOutput({ continue: true });
      return;
    }

    const client = createClient(apiKey);
    const containerTag = getContainerTag(cwd);
    const projectName = getProjectName(cwd);
    const collectionId = await getOrCreateCollection(
      client,
      containerTag,
      projectName,
    ).catch(() => containerTag);

    // Store conversation using Nebula's conversation format
    // The role field triggers conversation mode in the SDK
    await client.storeMemory({
      memory_id: sessionId,
      collection_id: collectionId,
      content: extracted.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      metadata: { project: projectName },
    });

    debugLog(settings, 'Conversation saved', {
      count: extracted.messages.length,
    });
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
