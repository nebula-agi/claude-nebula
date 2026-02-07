---
description: Index codebase into Nebula for persistent context
allowed-tools: ["Bash"]
---

Index the current codebase into Nebula by uploading source files for Tree-sitter processing.

Run this command:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/index-code.cjs"
```

This will:
1. Discover all git-tracked files
2. Skip lockfiles, minified/generated files, and files > 100KB
3. Upload files in batches to Nebula for AST/symbol extraction

After indexing, code symbols and structure will be searchable via `/nebula-search`.
