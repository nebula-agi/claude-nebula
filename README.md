# Claude-Nebula

**Persistent semantic memory for [Claude Code](https://docs.anthropic.com/en/docs/claude-code), powered by [Nebula](https://trynebula.ai).**

Every conversation is automatically captured and stored. When you need to recall something from a past session - what you worked on, how something was implemented, a decision you made - Claude searches your memory and brings it back.

---

## Quick Start

### 1. Get credentials

- Sign up at [trynebula.ai](https://trynebula.ai) and create an API key
- Create a collection (via dashboard or API) and copy the **collection ID**

### 2. Configure

```bash
mkdir -p ~/.nebula-claude
cat > ~/.nebula-claude/settings.json << 'EOF'
{
  "apiKey": "your-nebula-api-key",
  "collectionId": "your-collection-id"
}
EOF
```

Or use environment variables (these take precedence):

```bash
export CC_NEBULA_API_KEY="your-nebula-api-key"
export CC_NEBULA_COLLECTION_ID="your-collection-id"
```

### 3. Install

```
/plugin marketplace add nebula-agi/claude-nebula
/plugin install claude-nebula
```

### 4. Verify

Start a new Claude Code session and try:

```
/nebula-search "test"
```

---

## How It Works

### Automatic capture

The plugin hooks into Claude Code lifecycle events to capture conversations as they happen:


| Hook               | When it runs                    |
| ------------------ | ------------------------------- |
| `UserPromptSubmit` | Each time you send a prompt     |
| `Stop`             | When Claude finishes responding |


Messages are sent to Nebula via `storeMemories()`. Nebula handles chunking, embedding, ranking, deduplication, and knowledge graph extraction server-side. The plugin tracks what's already been sent per session -u nothing is duplicated.

### Auto-recall

On every prompt, a lightweight search hook automatically queries Nebula for memories relevant to your current message and injects them as context. No manual search needed for most cases.

### Manual search

For targeted lookups, use the `/nebula-search` slash command:

```
/nebula-search "how did we set up authentication?"
```

This runs a semantic search across all stored sessions and returns the most relevant conversation fragments, ranked by activation score.

### Codebase indexing

Use `/index` to have Claude explore your codebase and store a comprehensive summary (architecture, conventions, key files) into Nebula for future reference.

---

## Commands


| Command                  | Description                                     |
| ------------------------ | ----------------------------------------------- |
| `/nebula-search "query"` | Search memories for relevant past conversations |
| `/index`                 | Index your current codebase into Nebula         |
| `/logout`                | Clear saved Nebula credentials                  |


---

## Configuration

Settings file: `~/.nebula-claude/settings.json`


| Setting       | Key in settings.json | Env variable              | Required |
| ------------- | -------------------- | ------------------------- | -------- |
| API Key       | `apiKey`             | `CC_NEBULA_API_KEY`       | Yes      |
| Collection ID | `collectionId`       | `CC_NEBULA_COLLECTION_ID` | Yes      |
| Debug logging | `debug`              | `CC_NEBULA_DEBUG=true`    | No       |


---

## Project Structure

```
plugin/
  .claude-plugin/plugin.json    # Plugin metadata
  hooks/hooks.json              # Hook definitions
  skills/                       # Slash command definitions
  scripts/                      # Built output (*.cjs bundles)
  src/
    capture-hook.js             # Unified capture hook entry point
    search-hook.js              # Auto-recall hook (injects memories on each prompt)
    search-memory.js            # Manual search script (/nebula-search)
    index-code.js               # Codebase indexing script (/index)
    add-memory.js               # Manual memory storage script
    lib/
      capture.js                # Core: extract transcript -> storeMemories()
      nebula.js                 # SDK client + collection get-or-create
      settings.js               # Settings + API key resolution
      state.js                  # Session state management
      stdin.js                  # Hook I/O helpers
      transcript-formatter.js   # JSONL transcript parsing + position tracking
```

## Development

```bash
npm run build      # Bundle plugin/src/ -> plugin/scripts/*.cjs
npm run lint       # Run Biome linter
npm run lint:fix   # Auto-fix lint issues
npm run format     # Auto-format with Biome
npm run clean      # Remove built bundles
```

## License

MIT