---
description: Log out from Nebula and clear saved credentials
allowed-tools: ["Bash"]
---

# Logout from Nebula

Remove saved Nebula credentials to allow re-authentication.

## Steps

1. Use Bash to remove the credentials file:
   ```bash
   rm -f ~/.nebula-claude/credentials.json
   ```

2. Confirm to the user:
   ```
   Successfully logged out from Nebula.

   Your credentials have been removed. To re-authenticate, set the
   CC_NEBULA_API_KEY environment variable or save credentials in
   ~/.nebula-claude/credentials.json
   ```
