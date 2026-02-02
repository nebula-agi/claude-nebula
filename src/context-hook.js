const { NebulaClient } = require('./lib/nebula-client');
const { CollectionManager } = require('./lib/collection-manager');
const { getContainerTag, getProjectName } = require('./lib/container-tag');
const { loadSettings, getApiKey, debugLog } = require('./lib/settings');
const { readStdin, writeOutput } = require('./lib/stdin');
const { formatContext } = require('./lib/format-context');

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
          additionalContext: `<nebula-status>
No API key found. Please set NEBULA_API_KEY environment variable.
Get your API key from: https://trynebula.ai/settings/api-keys
</nebula-status>`,
        },
      });
      return;
    }

    const client = new NebulaClient(apiKey);
    const collectionManager = new CollectionManager(client);

    // Get or create collection for this project
    const collection = await collectionManager
      .getOrCreateCollection(containerTag, projectName)
      .catch((err) => {
        debugLog(settings, 'Collection creation failed', { error: err.message });
        return null;
      });

    if (!collection) {
      debugLog(settings, 'Using default collection');
    }

    const collectionId = collection?.id || containerTag;
    const profileResult = await client
      .getProfile(collectionId, projectName)
      .catch(() => null);

    const additionalContext = formatContext(
      profileResult,
      true,
      false,
      settings.maxProfileItems,
    );

    if (!additionalContext) {
      writeOutput({
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: `<nebula-context>
No previous memories found for this project.
Memories will be saved as you work.
</nebula-context>`,
        },
      });
      return;
    }

    debugLog(settings, 'Context generated', {
      length: additionalContext.length,
    });

    writeOutput({
      hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext },
    });
  } catch (err) {
    debugLog(settings, 'Error', { error: err.message });
    console.error(`Nebula: ${err.message}`);
    writeOutput({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: `<nebula-status>
Failed to load memories: ${err.message}
Session will continue without memory context.
</nebula-status>`,
      },
    });
  }
}

main().catch((err) => {
  console.error(`Nebula fatal: ${err.message}`);
  process.exit(1);
});
