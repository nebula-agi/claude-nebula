const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const SETTINGS_FILE = path.join(
  os.homedir(),
  '.nebula-claude',
  'settings.json',
);

function loadSettings() {
  const settings = { debug: false };
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const fileContent = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      Object.assign(settings, JSON.parse(fileContent));
    }
  } catch (err) {
    console.error(`Settings: Failed to load ${SETTINGS_FILE}: ${err.message}`);
  }
  if (process.env.NEBULA_API_KEY) settings.apiKey = process.env.NEBULA_API_KEY;
  if (process.env.NEBULA_COLLECTION_ID) settings.collectionId = process.env.NEBULA_COLLECTION_ID;
  if (process.env.NEBULA_DEBUG === 'true') settings.debug = true;
  return settings;
}

function getApiKey(settings) {
  if (settings.apiKey) return settings.apiKey;
  throw new Error('apiKey is required in ~/.nebula-claude/settings.json or NEBULA_API_KEY env var');
}

function debugLog(settings, message, data) {
  if (settings.debug) {
    const timestamp = new Date().toISOString();
    console.error(
      data
        ? `[${timestamp}] ${message}: ${JSON.stringify(data)}`
        : `[${timestamp}] ${message}`,
    );
  }
}

module.exports = {
  loadSettings,
  getApiKey,
  debugLog,
};
