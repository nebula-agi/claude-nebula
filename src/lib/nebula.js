const { Nebula } = require('@nebula-ai/sdk');
const { loadSettings, getApiKey } = require('./settings');

async function getProjectClient() {
  const settings = loadSettings();
  const apiKey = getApiKey(settings);
  const collectionId = process.env.NEBULA_COLLECTION_ID;
  if (!collectionId) throw new Error('NEBULA_COLLECTION_ID is required');

  return {
    client: new Nebula({ apiKey }),
    collectionId,
    settings,
  };
}

module.exports = {
  getProjectClient,
};
