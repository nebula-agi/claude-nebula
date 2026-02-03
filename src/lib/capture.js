const { createClient, getOrCreateCollection } = require('./nebula');
const { getContainerTag, getProjectName } = require('./container-tag');
const { loadSettings, getApiKey, debugLog } = require('./settings');
const {
  extractNewMessages,
  getNebulaMemoryId,
  setNebulaMemoryId,
} = require('./transcript-formatter');

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

    const messages = extracted.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Get or create memory_id for this session's conversation
    let nebulaMemoryId = getNebulaMemoryId(sessionId);

    // Store each message individually so Nebula can chunk them properly
    for (const msg of messages) {
      if (nebulaMemoryId) {
        // Append to existing conversation
        await client.storeMemory({
          memory_id: nebulaMemoryId,
          collection_id: collectionId,
          content: msg.content,
          role: msg.role,
          metadata: { project: projectName },
        });
      } else {
        // Create new conversation with first message
        nebulaMemoryId = await client.storeMemory({
          collection_id: collectionId,
          content: msg.content,
          role: msg.role,
          metadata: { project: projectName },
        });
        setNebulaMemoryId(sessionId, nebulaMemoryId);
      }
    }

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
