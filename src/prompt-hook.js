const { captureNewMessages } = require('./lib/capture');
const { loadSettings, debugLog } = require('./lib/settings');
const { readStdin, outputSuccess } = require('./lib/stdin');

async function main() {
  const settings = loadSettings();

  try {
    const input = await readStdin();
    const { session_id: sessionId, transcript_path: transcriptPath } = input;
    const cwd = input.cwd || process.cwd();

    debugLog(settings, 'UserPromptSubmit', { sessionId });

    await captureNewMessages(transcriptPath, sessionId, cwd, 'UserPromptSubmit');

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
