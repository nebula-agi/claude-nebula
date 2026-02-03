const { captureNewMessages } = require('./lib/capture');
const { loadSettings, debugLog } = require('./lib/settings');
const { readStdin, writeOutput } = require('./lib/stdin');

async function main() {
  const settings = loadSettings();

  try {
    const input = await readStdin();
    const { session_id: sessionId, transcript_path: transcriptPath } = input;
    const cwd = input.cwd || process.cwd();

    debugLog(settings, 'Stop', { sessionId, transcriptPath });

    const result = await captureNewMessages(transcriptPath, sessionId, cwd, 'Stop');

    if (result.count > 0) {
      debugLog(settings, 'Stop: Final capture completed', { count: result.count });
    }

    writeOutput({ continue: true });
  } catch (err) {
    debugLog(settings, 'Error', { error: err.message });
    console.error(`Nebula: ${err.message}`);
    writeOutput({ continue: true });
  }
}

main().catch((err) => {
  console.error(`Nebula fatal: ${err.message}`);
  process.exit(1);
});
