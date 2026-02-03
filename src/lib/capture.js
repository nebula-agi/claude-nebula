const { createClient, getOrCreateCollection } = require('./nebula');
const { getContainerTag, getProjectName } = require('./container-tag');
const { loadSettings, getApiKey, debugLog } = require('./settings');
const { extractNewMessages } = require('./transcript-formatter');

/**
 * Capture and store new messages from the transcript to Nebula.
 * This is the shared abstraction used by all hooks (prompt, observation, summary).
 *
 * @param {string} transcriptPath - Path to the transcript JSONL file
 * @param {string} sessionId - The session ID (used as memory_id for appending)
 * @param {string} cwd - Current working directory for project identification
 * @param {string} hookName - Name of the calling hook for debug logging
 * @returns {Promise<{success: boolean, count: number}>}
 */
async function captureNewMessages(transcriptPath, sessionId, cwd, hookName) {
  const settings = loadSettings();

  if (!transcriptPath || !sessionId) {
    debugLog(settings, `${hookName}: Missing transcriptPath or sessionId`);
    return { success: false, count: 0 };
  }

  let apiKey;
  try {
    apiKey = getApiKey(settings);
  } catch {
    debugLog(settings, `${hookName}: No API key configured`);
    return { success: false, count: 0 };
  }

  const extracted = extractNewMessages(transcriptPath, sessionId);
  if (!extracted) {
    debugLog(settings, `${hookName}: No new content to save`);
    return { success: true, count: 0 };
  }

  try {
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

    debugLog(settings, `${hookName}: Conversation saved`, {
      count: extracted.messages.length,
    });

    return { success: true, count: extracted.messages.length };
  } catch (err) {
    debugLog(settings, `${hookName}: Error`, { error: err.message });
    return { success: false, count: 0, error: err.message };
  }
}

module.exports = {
  captureNewMessages,
};
