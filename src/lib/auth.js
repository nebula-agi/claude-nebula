const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const SETTINGS_DIR = path.join(os.homedir(), '.nebula-claude');
const CREDENTIALS_FILE = path.join(SETTINGS_DIR, 'credentials.json');
const API_URL = process.env.NEBULA_API_URL || 'https://api.trynebula.ai';

function ensureDir() {
  if (!fs.existsSync(SETTINGS_DIR)) {
    fs.mkdirSync(SETTINGS_DIR, { recursive: true });
  }
}

function loadCredentials() {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const data = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
      if (data.apiKey) return data;
    }
  } catch {}
  return null;
}

function saveCredentials(apiKey) {
  ensureDir();
  const data = {
    apiKey,
    savedAt: new Date().toISOString(),
    apiUrl: API_URL,
  };
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(data, null, 2));
}

function clearCredentials() {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      fs.unlinkSync(CREDENTIALS_FILE);
    }
  } catch {}
}

async function validateApiKey(apiKey) {
  // Simple validation - just check if it's a non-empty string
  // More detailed validation happens when making API calls
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return { valid: false, error: 'API key must be a non-empty string' };
  }
  return { valid: true };
}

module.exports = {
  SETTINGS_DIR,
  CREDENTIALS_FILE,
  loadCredentials,
  saveCredentials,
  clearCredentials,
  validateApiKey,
};
