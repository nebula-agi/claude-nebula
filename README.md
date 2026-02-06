# Claude-Nebula

Claude Code plugin for persistent memory via [Nebula](https://trynebula.ai).

## Setup

1. Create a collection at [trynebula.ai](https://trynebula.ai)
2. Install the plugin:
```bash
npm install && npm run build
claude plugin install ./plugin
```
3. Set env vars:
```bash
export NEBULA_API_KEY="your_key"
export NEBULA_COLLECTION_ID="your_collection_id"
```

## What It Does

- **Capture**: `UserPromptSubmit` and `Stop` hooks send conversation messages to Nebula via `storeMemories()`
- **Search**: `/nebula-search "query"` — agent-driven semantic search over past sessions

Nebula handles chunking, embedding, ranking, dedup, and graph extraction server-side.

## Config

```bash
NEBULA_API_KEY=your_key              # required
NEBULA_COLLECTION_ID=your_id         # required
NEBULA_DEBUG=true                    # optional
```

## License

MIT
