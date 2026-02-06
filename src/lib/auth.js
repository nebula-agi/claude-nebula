const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const CREDENTIALS_FILE = path.join(
  os.homedir(),
  '.nebula-claude',
  'credentials.json',
);

function loadCredentials() {
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const data = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
      if (data.apiKey) return data;
    }
  } catch {}
  return null;
}

module.exports = {
  loadCredentials,
};
