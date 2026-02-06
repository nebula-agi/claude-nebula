const { Nebula } = require('@nebula-ai/sdk');
const { loadSettings, getApiKey } = require('./settings');

async function getProjectClient() {
  const settings = loadSettings();
  const apiKey = getApiKey(settings);
  const collectionId = settings.collectionId;

  if (!collectionId) {
    throw new Error('collectionId is required in ~/.nebula-claude/settings.json or NEBULA_COLLECTION_ID env var');
  }

  return {
    client: new Nebula({ apiKey }),
    collectionId,
    settings,
  };
}

module.exports = {
  getProjectClient,
};
