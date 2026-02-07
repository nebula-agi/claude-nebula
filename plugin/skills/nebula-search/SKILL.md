---

## name: nebula-search

description: Search through long-term memories for relevant information using Nebula. IMPORTANT: You should proactively call this tool at the start of each conversation turn to check for relevant context, user preferences, or past discussions before responding. Use when user asks about past work, previous sessions, how something was implemented, what they worked on before, or wants to recall information from earlier sessions.
allowed-tools: Bash(node:*)

# Nebula Search

Search command: `node "${CLAUDE_PLUGIN_ROOT}/scripts/search-memory.cjs" "QUERY"`

## Instructions

You are a search agent. Your job is to find the most relevant memories for the user's request.

1. **Analyze the user's intent.** Break down what they're actually looking for. A vague question like "how did we handle errors?" might need multiple angles.
2. **Formulate search queries.** Rephrase the user's request into 1-3 targeted search queries. Use specific keywords, synonyms, and alternate phrasings that are likely to match stored conversations. For example:
  - User asks: "how did we set up auth?" -> search "authentication setup", "login implementation", "auth middleware"
  - User asks: "what did we work on last week?" -> search "refactor", "bug fix", "feature implementation"
3. **Run searches.** Execute each query using the search command above.
4. **Refine if needed.** If results are sparse or not relevant, try different phrasings or broader/narrower queries. Do up to 5 searches total.
5. **Synthesize.** Present a clear summary of what you found, citing the most relevant memories. If nothing useful was found, say so honestly.

