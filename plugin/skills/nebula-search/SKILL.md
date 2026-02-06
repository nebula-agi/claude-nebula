---

## name: nebula-search
description: Search through long-term memories for relevant information using Nebula. IMPORTANT: You should proactively call this tool at the start of each conversation turn to check for relevant context, user preferences, or past discussions before responding.
allowed-tools: Bash(node:*)

# Nebula Search

Run: `node "${CLAUDE_PLUGIN_ROOT}/scripts/search-memory.cjs" "QUERY"`