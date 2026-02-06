---

## name: nebula-search

description: Search through long-term memories for relevant information using Nebula. IMPORTANT: You should proactively call this tool at the start of each conversation turn to check for relevant context, user preferences, or past discussions before responding. Use when user asks about past work, previous sessions, how something was implemented, what they worked on before, or wants to recall information from earlier sessions.  
allowed-tools: Bash(node:*)

# Nebula Search

Run: `node "${CLAUDE_PLUGIN_ROOT}/scripts/search-memory.cjs" "QUERY"`