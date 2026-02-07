const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const STATE_DIR = path.join(os.homedir(), '.nebula-claude', 'state');

function loadState(sessionId, suffix = '') {
  try {
    const file = path.join(STATE_DIR, `${sessionId}${suffix}.json`);
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
  } catch {}
  return {};
}

function saveState(sessionId, state, suffix = '') {
  try {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(STATE_DIR, `${sessionId}${suffix}.json`),
      JSON.stringify(state),
    );
  } catch {}
}

module.exports = { loadState, saveState };
