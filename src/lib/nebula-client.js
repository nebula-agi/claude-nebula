const { Nebula } = require('@nebula-ai/sdk');

const DEFAULT_PROJECT_ID = 'claudecode_default';

class NebulaClient {
  constructor(apiKey, collectionId) {
    if (!apiKey) throw new Error('NEBULA_API_KEY is required');

    // Initialize Nebula SDK client
    this.client = new Nebula({ apiKey });
    this.collectionId = collectionId || DEFAULT_PROJECT_ID;
  }

  async addMemory(content, collectionId, metadata = {}, customId = null) {
    const payload = {
      collection_id: collectionId || this.collectionId,
      content,
      metadata: {
        source: 'claude-nebula-plugin',
        timestamp: new Date().toISOString(),
        ...metadata
      },
    };

    if (customId) payload.id = customId;

    const result = await this.client.storeMemory(payload);
    return {
      id: result,
      status: 'success',
      collectionId: collectionId || this.collectionId,
    };
  }

  async search(query, collectionId, options = {}) {
    const payload = {
      query,
      collection_ids: [collectionId || this.collectionId],
      limit: options.limit || 10,
    };

    // Nebula handles all filtering and categorization via its knowledge graph
    // No need to apply metadata filters - let Nebula do the work

    const result = await this.client.search(payload);

    // Nebula returns entities, facts, and utterances (stored text)
    const utterances = result.utterances || [];

    return {
      results: utterances.map((u) => ({
        id: u.chunk_id || u.engram_id,
        memory: u.text || '',
        similarity: u.activation_score || 0,
        title: u.display_name,
        content: u.text || '',
        timestamp: u.timestamp,
      })),
      total: utterances.length,
      timing: result.total_traversal_time_ms,
      // Include knowledge graph data for advanced use cases
      entities: result.entities || [],
      facts: result.facts || [],
    };
  }

  async getProfile(collectionId, query) {
    // Nebula's knowledge graph automatically surfaces relevant entities and facts
    // Just do a semantic search and let Nebula handle categorization
    const col = collectionId || this.collectionId;

    try {
      const searchResults = await this.search(query || 'user profile preferences recent work', col, {
        limit: 15,
      });

      // Nebula's knowledge graph naturally organizes information
      // Separate results based on activation scores and entities
      const allResults = searchResults.results;

      // Extract user preference facts from entities
      const staticFacts = searchResults.entities
        .filter(e => e.entity_category === 'idea' || e.entity_name.toLowerCase().includes('user'))
        .slice(0, 5)
        .map(e => e.profile?.entity?.description || e.entity_name)
        .filter(Boolean);

      // Extract recent work from facts
      const dynamicFacts = searchResults.facts
        .slice(0, 5)
        .map(f => `${f.subject} ${f.predicate} ${f.object_value}`)
        .filter(Boolean);

      return {
        profile: {
          static: staticFacts,
          dynamic: dynamicFacts,
        },
        searchResults: allResults.length > 0 ? searchResults : undefined,
      };
    } catch (err) {
      console.warn('Profile search failed:', err.message);
      return {
        profile: {
          static: [],
          dynamic: [],
        },
        searchResults: undefined,
      };
    }
  }

  async listMemories(collectionId, limit = 20) {
    // List memories using search with a broad query
    const result = await this.search('recent work memories', collectionId, { limit });
    return {
      memories: result.results.map(r => ({
        id: r.id,
        content: r.memory,
        similarity: r.similarity,
        createdAt: r.timestamp,
      }))
    };
  }

  async deleteMemory(memoryId) {
    try {
      await this.client.deleteMemory(memoryId);
      return { success: true, id: memoryId };
    } catch (err) {
      // If DELETE operation fails, return graceful error
      console.warn('Nebula DELETE operation failed:', err.message);
      return { success: false, error: err.message, id: memoryId };
    }
  }

  async createCollection(name, metadata = {}) {
    const payload = {
      name,
      metadata: {
        source: 'claude-code-plugin',
        created_at: new Date().toISOString(),
        ...metadata,
      },
    };

    const result = await this.client.createCollection(payload);
    return {
      id: result.id || result.collection_id || name,
      name: result.name || name,
    };
  }
}

module.exports = { NebulaClient };
