const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const TRACKER_DIR = path.join(os.homedir(), '.nebula-claude', 'trackers');
const MEMORY_IDS_FILE = path.join(os.homedir(), '.nebula-claude', 'memory-ids.json');

function ensureTrackerDir() {
  if (!fs.existsSync(TRACKER_DIR)) {
    fs.mkdirSync(TRACKER_DIR, { recursive: true });
  }
}

/**
 * Load the session → Nebula memory ID mapping.
 */
function loadMemoryIds() {
  try {
    if (fs.existsSync(MEMORY_IDS_FILE)) {
      return JSON.parse(fs.readFileSync(MEMORY_IDS_FILE, 'utf-8'));
    }
  } catch {
    // Ignore parse errors
  }
  return {};
}

/**
 * Save the session → Nebula memory ID mapping.
 */
function saveMemoryIds(mapping) {
  const dir = path.dirname(MEMORY_IDS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(MEMORY_IDS_FILE, JSON.stringify(mapping, null, 2));
}

/**
 * Get the Nebula memory ID for a session (if it exists).
 */
function getNebulaMemoryId(sessionId) {
  const mapping = loadMemoryIds();
  return mapping[sessionId] || null;
}

/**
 * Store the Nebula memory ID for a session.
 */
function setNebulaMemoryId(sessionId, memoryId) {
  const mapping = loadMemoryIds();
  mapping[sessionId] = memoryId;
  saveMemoryIds(mapping);
}

function getLastCapturedUuid(sessionId) {
  ensureTrackerDir();
  const trackerFile = path.join(TRACKER_DIR, `${sessionId}.txt`);
  if (fs.existsSync(trackerFile)) {
    return fs.readFileSync(trackerFile, 'utf-8').trim();
  }
  return null;
}

function setLastCapturedUuid(sessionId, uuid) {
  ensureTrackerDir();
  const trackerFile = path.join(TRACKER_DIR, `${sessionId}.txt`);
  fs.writeFileSync(trackerFile, uuid);
}

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

function cleanContent(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '')
    .replace(/<nebula-context>[\s\S]*?<\/nebula-context>/g, '')
    .trim();
}

/**
 * Extract text content from a message, handling both string and array content formats.
 */
function extractTextContent(message) {
  if (!message?.content) return null;

  const content = message.content;

  if (typeof content === 'string') {
    return cleanContent(content) || null;
  }

  if (!Array.isArray(content)) return null;

  const texts = content
    .filter((block) => block.type === 'text' && block.text)
    .map((block) => cleanContent(block.text))
    .filter(Boolean);

  return texts.length > 0 ? texts.join('\n\n') : null;
}

/**
 * Extract new conversation messages from transcript for Nebula's conversational endpoint.
 */
function extractNewMessages(transcriptPath, sessionId) {
  const entries = parseTranscript(transcriptPath);
  if (entries.length === 0) return null;

  const lastCapturedUuid = getLastCapturedUuid(sessionId);

  // Get entries since last capture
  let startIndex = 0;
  if (lastCapturedUuid) {
    const lastIndex = entries.findIndex((e) => e.uuid === lastCapturedUuid);
    if (lastIndex >= 0) startIndex = lastIndex + 1;
  }

  const newEntries = entries
    .slice(startIndex)
    .filter((e) => e.type === 'user' || e.type === 'assistant');

  if (newEntries.length === 0) return null;

  // Extract messages with role and content
  const messages = newEntries
    .map((entry) => {
      const content = extractTextContent(entry.message);
      if (!content || content.length <= 10) return null;
      return { role: entry.type, content };
    })
    .filter(Boolean);

  if (messages.length === 0) return null;

  const lastEntry = newEntries[newEntries.length - 1];
  setLastCapturedUuid(sessionId, lastEntry.uuid);

  return {
    messages,
    timestamp: newEntries[0].timestamp || new Date().toISOString(),
  };
}

module.exports = {
  extractNewMessages,
  parseTranscript,
  cleanContent,
  getLastCapturedUuid,
  setLastCapturedUuid,
  getNebulaMemoryId,
  setNebulaMemoryId,
};
