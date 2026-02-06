# Claude-Nebula

A [Claude Code](https://docs.anthropic.com/en/docs/claude-code) plugin that gives Claude persistent semantic memory across sessions, powered by [Nebula](https://trynebula.ai).

Every conversation is automatically captured and stored in Nebula. When you need to recall something from a past session - what you worked on, how something was implemented, a decision you made - Claude can search your memory and bring it back.

## How It Works

### Automatic Capture

The plugin hooks into two Claude Code lifecycle events:

- **UserPromptSubmit** - captures new messages each time you send a prompt
- **Stop** - captures any remaining messages when Claude finishes responding

Messages are sent to Nebula as conversation memories using `storeMemories()`. Nebula handles chunking, embedding, ranking, deduplication, and knowledge graph extraction server-side. The plugin tracks what has already been sent per session so nothing is duplicated.

### Search

Use the `/nebula-search` slash command to search across all stored sessions:

```
/nebula-search "how did we set up authentication?"
```

This performs a semantic search over your collection and returns the most relevant conversation fragments, ranked by activation score.

### Codebase Indexing

Use `/index` to have Claude explore your codebase and store a comprehensive summary (architecture, conventions, key files) into Nebula for future reference.

## Setup

### 1. Get a Nebula API Key

Sign up at [trynebula.ai](https://trynebula.ai) and create an API key from your dashboard.

### 2. Create a Collection

Create a collection in Nebula (via the dashboard or API). Copy the **collection ID** - this is where your memories will be stored.

### 3. Configure Credentials

Create the settings file:

```bash
mkdir -p ~/.nebula-claude
cat > ~/.nebula-claude/settings.json << 'EOF'
{
  "apiKey": "your-nebula-api-key",
  "collectionId": "your-collection-id"
}
EOF
```

Alternatively, use environment variables (these override the settings file):

```bash
export CC_NEBULA_API_KEY="your-nebula-api-key"
export CC_NEBULA_COLLECTION_ID="your-collection-id"
```

### 4. Install the Plugin

```bash
git clone https://github.com/nebula-agi/claude-nebula.git
cd claude-nebula
npm install
npm run build
claude plugin install ./plugin
```

The build step bundles the source files into `plugin/scripts/*.cjs` using esbuild.

### 5. Verify

Start a new Claude Code session. The capture hooks will run automatically in the background. Try a search to confirm everything is connected:

```
/nebula-search "test"
```

## Configuration Reference


| Setting       | settings.json key | Environment variable      | Required |
| ------------- | ----------------- | ------------------------- | -------- |
| API Key       | `apiKey`          | `CC_NEBULA_API_KEY`       | Yes      |
| Collection ID | `collectionId`    | `CC_NEBULA_COLLECTION_ID` | Yes      |
| Debug logging | `debug`           | `CC_NEBULA_DEBUG=true`    | No       |


Settings file location: `~/.nebula-claude/settings.json`

Environment variables take precedence over the settings file.

## Slash Commands


| Command                  | Description                                        |
| ------------------------ | -------------------------------------------------- |
| `/nebula-search "query"` | Search your memory for relevant past conversations |
| `/index`                 | Index your current codebase into Nebula            |
| `/logout`                | Clear saved Nebula credentials                     |


## Project Structure

```
plugin/
  .claude-plugin/plugin.json   # Plugin metadata
  hooks/hooks.json             # Hook definitions (UserPromptSubmit, Stop)
  scripts/                     # Built output (*.cjs bundles)
  skills/                      # Slash command definitions
  src/
    capture-hook.js            # Unified capture hook entry point
    search-memory.js           # Search script
    add-memory.js              # Manual memory storage script
    lib/
      capture.js               # Core: extract transcript -> storeMemories()
      nebula.js                # SDK client creation
      settings.js              # Settings + API key resolution
      stdin.js                 # Hook I/O helpers
      transcript-formatter.js  # JSONL transcript parsing + position tracking
```

## Development

```bash
npm run build      # Bundle plugin/src/ -> plugin/scripts/*.cjs
npm run lint       # Run Biome linter
npm run lint:fix   # Auto-fix lint issues
npm run clean      # Remove built bundles
```

## License

MIT
