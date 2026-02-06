const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { loadCredentials } = require('./auth');

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
  if (process.env.NEBULA_DEBUG === 'true') settings.debug = true;
  return settings;
}

function getApiKey(settings) {
  if (settings.apiKey) return settings.apiKey;
  if (process.env.NEBULA_API_KEY) return process.env.NEBULA_API_KEY;

  const credentials = loadCredentials();
  if (credentials?.apiKey) return credentials.apiKey;

  throw new Error('NO_API_KEY');
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
