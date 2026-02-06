const { captureMessages } = require('./lib/capture');
const { loadSettings, debugLog } = require('./lib/settings');
const { readStdin, writeOutput } = require('./lib/stdin');

const hookName = process.argv[2] || 'Stop';

async function main() {
  const settings = loadSettings();

  try {
    const input = await readStdin();

    await captureMessages(input.transcript_path, input.session_id, hookName);

    writeOutput({ continue: true });
  } catch (err) {
    debugLog(settings, 'Error', { error: err.message });
    writeOutput({ continue: true });
  }
}

main().catch((err) => {
  console.error(`Nebula fatal: ${err.message}`);
  process.exit(1);
});
