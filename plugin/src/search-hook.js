const { getProjectClient } = require('./lib/nebula');
const { loadSettings, debugLog } = require('./lib/settings');
const { readStdin, writeOutput } = require('./lib/stdin');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const MIN_SCORE = 0.3;
const CHAR_BUDGET = 2000;
const STATE_DIR = path.join(os.homedir(), '.nebula-claude', 'state');

const LOG_FILE = path.join(os.homedir(), '.nebula-claude', 'search-hook.log');

function fileLog(settings, msg) {
  if (!settings.debug) return;
  try {
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    fs.appendFileSync(LOG_FILE, line);
  } catch {
    // ignore
  }
}

function getStateFile(sessionId) {
  return path.join(STATE_DIR, `${sessionId}-search.json`);
}

function loadLastHash(sessionId) {
  try {
    const file = getStateFile(sessionId);
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      return data.hash || '';
    }
  } catch {
    // ignore
  }
  return '';
}

function saveHash(sessionId, hash) {
  try {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.writeFileSync(getStateFile(sessionId), JSON.stringify({ hash }));
  } catch {
    // ignore
  }
}

function formatResults(utterances) {
  let output = 'Relevant memories from past sessions:';
  let charCount = output.length;
  let index = 0;

  for (const u of utterances) {
    const score = Math.round((u.activation_score || 0) * 100);
    const role = u.source_role ? `[${u.source_role}] ` : '';
    const text = u.text || '';
    const line = `\n${index + 1}. (${score}%) ${role}${text}`;

    if (charCount + line.length > CHAR_BUDGET && index > 0) break;
    output += line;
    charCount += line.length;
    index++;
  }

  return output;
}

async function main() {
  const settings = loadSettings();

  try {
    const input = await readStdin();
    const prompt = input.prompt || '';

    fileLog(settings, `search-hook invoked, prompt length=${prompt.length}`);

    if (!prompt.trim() || prompt.trim().length < 3) {
      fileLog(settings, 'skipped: prompt too short');
      process.exit(0);
    }

    const { client, collectionId } = await getProjectClient();
    const result = await client.search({
      query: prompt,
      collection_ids: [collectionId],
    });
    const utterances = (result.utterances || []).filter(
      (u) => (u.activation_score || 0) >= MIN_SCORE,
    );

    fileLog(
      settings,
      `search returned ${utterances.length} results above threshold`,
    );

    if (utterances.length === 0) {
      process.exit(0);
    }

    const formatted = formatResults(utterances);

    // Deduplicate: skip if identical to last injection for this session
    const hash = crypto.createHash('md5').update(formatted).digest('hex');
    const sessionId = input.session_id || 'default';
    const lastHash = loadLastHash(sessionId);

    if (hash === lastHash) {
      fileLog(settings, 'skipped: deduplicated (same as last injection)');
      process.exit(0);
    }

    saveHash(sessionId, hash);

    fileLog(settings, `injecting ${formatted.length} chars of context`);
    writeOutput({
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext: formatted,
      },
    });
  } catch (err) {
    debugLog(settings, 'search-hook error', { error: err.message });
    fileLog(settings, `error: ${err.message}`);
    process.exit(0);
  }
}

main().catch(() => {
  process.exit(0);
});
