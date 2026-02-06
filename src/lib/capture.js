const { getProjectClient } = require('./nebula');
const { debugLog } = require('./settings');
const { extractNewMessages, saveMemoryId } = require('./transcript-formatter');

async function captureMessages(transcriptPath, sessionId, hookName) {
  if (!transcriptPath || !sessionId) {
    return { success: false, count: 0 };
  }

  const extracted = extractNewMessages(transcriptPath, sessionId);
  if (!extracted) {
    return { success: true, count: 0 };
  }

  try {
    const { client, collectionId, settings } = await getProjectClient();

    const memoryMessages = extracted.messages.map((m) => ({
      collection_id: collectionId,
      content: m.content,
      role: m.role,
      ...(extracted.memoryId ? { memory_id: extracted.memoryId } : {}),
    }));
    const results = await client.storeMemories(memoryMessages);
    if (!extracted.memoryId && results.length > 0) {
      saveMemoryId(sessionId, results[0]);
    }

    debugLog(settings, `${hookName}: Saved`, {
      count: extracted.messages.length,
    });

    return { success: true, count: extracted.messages.length };
  } catch (err) {
    return { success: false, count: 0, error: err.message };
  }
}

module.exports = {
  captureMessages,
};
