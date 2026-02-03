const { captureNewMessages } = require('./lib/capture');
const { loadSettings, debugLog } = require('./lib/settings');
const { readStdin, outputSuccess } = require('./lib/stdin');

async function main() {
  const settings = loadSettings();

  try {
    const input = await readStdin();
    const { session_id: sessionId, transcript_path: transcriptPath, tool_name: toolName } = input;
    const cwd = input.cwd || process.cwd();

    debugLog(settings, 'PostToolUse', { sessionId, toolName });

    await captureNewMessages(transcriptPath, sessionId, cwd, 'PostToolUse');

    outputSuccess();
  } catch (err) {
    debugLog(settings, 'Error', { error: err.message });
    outputSuccess();
  }
}

main().catch((err) => {
  console.error(`Nebula fatal: ${err.message}`);
  process.exit(1);
});
