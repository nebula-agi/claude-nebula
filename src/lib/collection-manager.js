const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const SETTINGS_DIR = path.join(os.homedir(), '.nebula-claude');
const COLLECTIONS_FILE = path.join(SETTINGS_DIR, 'collections.json');

class CollectionManager {
  constructor(nebulaClient) {
    this.client = nebulaClient;
    this.cache = this._loadCache();
  }

  _ensureDir() {
    if (!fs.existsSync(SETTINGS_DIR)) {
      fs.mkdirSync(SETTINGS_DIR, { recursive: true });
    }
  }

  _loadCache() {
    try {
      if (fs.existsSync(COLLECTIONS_FILE)) {
        const data = fs.readFileSync(COLLECTIONS_FILE, 'utf-8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.error(`Failed to load collections cache: ${err.message}`);
    }
    return {};
  }

  _saveCache() {
    this._ensureDir();
    try {
      fs.writeFileSync(COLLECTIONS_FILE, JSON.stringify(this.cache, null, 2));
    } catch (err) {
      console.error(`Failed to save collections cache: ${err.message}`);
    }
  }

  _generateFriendlyName(containerTag, projectName) {
    // Use project name if available, otherwise create from hash
    if (projectName && projectName !== containerTag) {
      return projectName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
    }
    // For hash-based tags, create a readable name
    return `project_${containerTag.substring(0, 8)}`;
  }

  async getOrCreateCollection(containerTag, projectName = null) {
    // Check cache first
    if (this.cache[containerTag]) {
      return this.cache[containerTag];
    }

    // Generate friendly collection name
    const friendlyName = this._generateFriendlyName(containerTag, projectName);

    try {
      // Attempt to create collection
      const result = await this.client.createCollection(friendlyName, {
        container_tag: containerTag,
        project_name: projectName,
      });

      const collectionData = {
        id: result.id,
        name: result.name || friendlyName,
        containerTag,
        createdAt: new Date().toISOString(),
      };

      // Cache the mapping
      this.cache[containerTag] = collectionData;
      this._saveCache();

      return collectionData;
    } catch (err) {
      // If collection already exists (409 or similar), try to use the name as ID
      if (err.message.includes('409') || err.message.includes('exists')) {
        console.warn(`Collection ${friendlyName} already exists, using name as ID`);
        const collectionData = {
          id: friendlyName,
          name: friendlyName,
          containerTag,
          createdAt: new Date().toISOString(),
        };
        this.cache[containerTag] = collectionData;
        this._saveCache();
        return collectionData;
      }

      // For other errors, re-throw
      throw new Error(`Failed to create collection: ${err.message}`);
    }
  }

  getCollectionId(containerTag) {
    return this.cache[containerTag]?.id || null;
  }

  clearCache() {
    this.cache = {};
    this._saveCache();
  }
}

module.exports = { CollectionManager, SETTINGS_DIR, COLLECTIONS_FILE };
