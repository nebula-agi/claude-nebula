const { getProjectClient } = require('./lib/nebula');
const { loadSettings, debugLog } = require('./lib/settings');
const { readStdin, writeOutput } = require('./lib/stdin');
const { loadState, saveState } = require('./lib/state');
const crypto = require('node:crypto');

const MIN_SCORE = 0.3;
const CHAR_BUDGET = 2000;

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
    const prompt = (input.prompt || '').trim();

    debugLog(settings, 'search-hook invoked', { promptLength: prompt.length });

    if (prompt.length < 3) {
      debugLog(settings, 'search-hook skipped: prompt too short');
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

    debugLog(settings, 'search-hook results', { count: utterances.length });

    if (utterances.length === 0) {
      process.exit(0);
    }

    const formatted = formatResults(utterances);

    // Deduplicate: skip if identical to last injection for this session
    const hash = crypto.createHash('md5').update(formatted).digest('hex');
    const sessionId = input.session_id || 'default';
    const state = loadState(sessionId, '-search');

    if (hash === state.hash) {
      debugLog(settings, 'search-hook skipped: deduplicated');
      process.exit(0);
    }

    saveState(sessionId, { hash }, '-search');

    debugLog(settings, 'search-hook injecting', { chars: formatted.length });
    writeOutput({
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext: formatted,
      },
    });
  } catch (err) {
    debugLog(settings, 'search-hook error', { error: err.message });
    process.exit(0);
  }
}

main().catch(() => {
  process.exit(0);
});
