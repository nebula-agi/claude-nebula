# Claude-Nebula

> **Semantic memory for Claude Code powered by Nebula AI**

A Claude Code plugin that gives your AI persistent semantic memory across sessions using [Nebula](https://trynebula.ai).
Your agent remembers what you worked on - across sessions, across projects - using intelligent semantic search.

## Features

- **Semantic Context Injection**: On session start, relevant memories are automatically retrieved and injected into Claude's context
- **Automatic Capture**: Conversation turns are captured and stored with semantic embeddings for future retrieval
- **Codebase Indexing**: Index your project's architecture, patterns, and conventions with semantic understanding
- **Collection-based Isolation**: Memories are organized by project using intelligent collections

## Installation

```bash
# From local directory
cd /path/to/claude-nebula
npm install
npm run build

# Install the plugin
claude plugin install ./plugin

# Set your API key
export NEBULA_API_KEY="your_nebula_api_key"
```

Get your API key at [trynebula.ai/settings/api-keys](https://trynebula.ai/settings/api-keys).

## How It Works

### On Session Start

The plugin fetches semantically relevant memories from Nebula and injects them into Claude's context:

```
<nebula-context>
The following is recalled context about the user...

## User Preferences (Persistent)
- Prefers TypeScript over JavaScript
- Uses Bun as package manager

## Recent Context
- Working on authentication flow

</nebula-context>
```

### During Session

Conversation turns are automatically captured on each stop and stored with semantic embeddings for intelligent future retrieval.

### Skills

**super-search**: When you ask about past work, previous sessions, or want to recall information, the agent automatically searches your memories using semantic similarity.

## Commands

### /claude-nebula:index

Index your codebase into Nebula. Explores project structure, architecture, conventions, and key files with semantic understanding.

```
/claude-nebula:index
```

### /claude-nebula:logout

Log out from Nebula and clear saved credentials.

```
/claude-nebula:logout
```

## Configuration

### Environment Variables

```bash
# Required
NEBULA_API_KEY=your_key_here

# Optional
NEBULA_API_URL=https://api.trynebula.ai/v1  # Custom API endpoint
NEBULA_SKIP_TOOLS=Read,Glob,Grep             # Tools to not capture
NEBULA_DEBUG=true                             # Enable debug logging
```

### Settings File

Create `~/.nebula-claude/settings.json`:

```json
{
  "skipTools": ["Read", "Glob", "Grep", "TodoWrite"],
  "captureTools": ["Edit", "Write", "Bash", "Task"],
  "maxProfileItems": 5,
  "debug": false,
  "injectProfile": true
}
```

## Why Nebula?

Nebula provides advanced semantic memory powered by knowledge graphs:

- **Automatic Entity Extraction**: Nebula identifies key concepts, people, and objects
- **Relationship Mapping**: Understands how entities relate to each other
- **Semantic Search**: Find memories by meaning, not just keywords
- **AI-Generated Context**: Rich descriptions for extracted entities
- **No Manual Categorization**: The knowledge graph handles everything

## Architecture

### Memory Types

Memories are tagged with `memory_type` metadata:

- **`conversation`**: Regular session memories (default)
- **`user_preference`**: Static facts about user preferences
- **`recent_context`**: Dynamic context from recent work
- **`codebase_index`**: Indexed codebase information

### Collections

Each project gets its own Nebula collection for memory isolation:

- Collection names are generated from project paths
- Mapping cached in `~/.nebula-claude/collections.json`
- Collections created automatically on first use

## Troubleshooting

### "No API key found" error

Make sure you've set the `NEBULA_API_KEY` environment variable:

```bash
export NEBULA_API_KEY=your_key_here
```

Or save credentials in `~/.nebula-claude/credentials.json`:

```json
{
  "apiKey": "your_key_here",
  "savedAt": "2026-02-01T...",
  "apiUrl": "https://api.trynebula.ai"
}
```

### "Failed to create collection" error

Check that your API key has write permissions. You can verify by:

1. Logging into [trynebula.ai](https://trynebula.ai)
2. Checking your API key permissions
3. Regenerating the key if needed

### Session starts but no context injected

This is normal for first-time usage. After your first session:

1. Work with Claude Code (make edits, write code)
2. End the session
3. Start a new session - context should now be injected

### Debug mode

Enable debug logging to see what's happening:

```bash
export NEBULA_DEBUG=true
```

Debug logs appear in stderr and show:
- API calls being made
- Collection creation
- Memory retrieval
- Context injection

## Requirements

- Node.js >= 18.0.0 (for built-in fetch API)
- Claude Code CLI
- Nebula API key

## License

MIT
