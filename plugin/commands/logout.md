---
description: Log out from Nebula and clear saved credentials
allowed-tools: ["Bash"]
---

# Logout from Nebula

Remove saved Nebula credentials to allow re-authentication.

## Steps

1. Use Bash to remove the settings file:
   ```bash
   rm -f ~/.nebula-claude/settings.json
   ```

2. Confirm to the user:
   ```
   Successfully logged out from Nebula.

   Your settings have been removed. To re-authenticate, create
   ~/.nebula-claude/settings.json or set the CC_NEBULA_API_KEY
   environment variable.
   ```
