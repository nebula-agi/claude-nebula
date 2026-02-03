const {
  createClient,
  getOrCreateCollection,
  formatSearchContext,
} = require('./lib/nebula');
const { getContainerTag, getProjectName } = require('./lib/container-tag');
const { loadSettings, getApiKey, debugLog } = require('./lib/settings');
const { readStdin, writeOutput } = require('./lib/stdin');

async function main() {
  const settings = loadSettings();

  try {
    const input = await readStdin();
    const cwd = input.cwd || process.cwd();
    const containerTag = getContainerTag(cwd);
    const projectName = getProjectName(cwd);

    debugLog(settings, 'SessionStart', { cwd, containerTag, projectName });

    let apiKey;
    try {
      apiKey = getApiKey(settings);
    } catch {
      writeOutput({
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: `<nebula-context>
No API key found. Set NEBULA_API_KEY environment variable.
Get your key at: https://trynebula.ai/settings/api-keys
</nebula-context>`,
        },
      });
      return;
    }

    const client = createClient(apiKey);
    const collectionId = await getOrCreateCollection(
      client,
      containerTag,
      projectName,
    ).catch(() => containerTag);

    // Search for relevant context
    const searchResult = await client
      .search({
        query: `${projectName} recent work context`,
        collection_ids: [collectionId],
      })
      .catch(() => null);

    const context = searchResult
      ? formatSearchContext(searchResult, settings.maxProfileItems)
      : null;

    writeOutput({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext:
          context ||
          `<nebula-context>
No previous memories found for this project.
Memories will be saved as you work.
</nebula-context>`,
      },
    });
  } catch (err) {
    debugLog(settings, 'Error', { error: err.message });
    writeOutput({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: `<nebula-context>
Failed to load memories: ${err.message}
</nebula-context>`,
      },
    });
  }
}

main().catch((err) => {
  console.error(`Nebula fatal: ${err.message}`);
  process.exit(1);
});
