const fs = require('node:fs');
const { loadState, saveState } = require('./state');

function parseTranscript(transcriptPath) {
  if (!fs.existsSync(transcriptPath)) {
    return [];
  }

  const content = fs.readFileSync(transcriptPath, 'utf-8');
  return content
    .trim()
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function extractTextContent(message) {
  if (!message?.content) return null;

  const content = message.content;

  if (typeof content === 'string') {
    return content.trim() || null;
  }

  if (!Array.isArray(content)) return null;

  const texts = content
    .filter((block) => block.type === 'text' && block.text)
    .map((block) => block.text.trim())
    .filter(Boolean);

  return texts.length > 0 ? texts.join('\n\n') : null;
}

function extractNewMessages(transcriptPath, sessionId) {
  const entries = parseTranscript(transcriptPath);
  if (entries.length === 0) return null;

  const state = loadState(sessionId);

  let startIndex = 0;
  if (state.lastUuid) {
    const lastIndex = entries.findIndex((e) => e.uuid === state.lastUuid);
    if (lastIndex >= 0) startIndex = lastIndex + 1;
  }

  const newEntries = entries
    .slice(startIndex)
    .filter((e) => e.type === 'user' || e.type === 'assistant');

  if (newEntries.length === 0) return null;

  const messages = newEntries
    .map((entry) => {
      const content = extractTextContent(entry.message);
      if (!content) return null;
      return { role: entry.type, content };
    })
    .filter(Boolean);

  if (messages.length === 0) return null;

  // Update state with last captured position
  const lastEntry = newEntries[newEntries.length - 1];
  saveState(sessionId, { ...state, lastUuid: lastEntry.uuid });

  return { messages, memoryId: state.memoryId || null };
}

function saveMemoryId(sessionId, memoryId) {
  const state = loadState(sessionId);
  saveState(sessionId, { ...state, memoryId });
}

module.exports = {
  extractNewMessages,
  saveMemoryId,
};
