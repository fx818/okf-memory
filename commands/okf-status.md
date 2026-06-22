---
description: Show a cheap snapshot of the .knowledge/ bundle (counts, staleness, pending sync, budgets)
---

Show the state of the OKF memory bundle without burning model tokens on parsing.

## Procedure

1. **Run the deterministic status script** (no model parsing needed):

   ```
   node "${CLAUDE_PLUGIN_ROOT}/scripts/okf.mjs" status
   ```

   If `$CLAUDE_PLUGIN_ROOT` is not set in this environment, find the `okf-memory` plugin directory and run `scripts/okf.mjs` from there. The script reads `.knowledge/` in the current repo.

2. **Present the output** to the user as-is, then add at most one line of interpretation:
   - If there are pending-sync files, mention they can run `/okf-sync`.
   - If the log format is `legacy-flat`, mention `/okf-check` can migrate it.
   - If anything is over budget, mention `/okf-check` for details.

3. If the script reports no bundle, tell the user to run `/okf-init`. Do not scan the codebase.

Keep it short — this command is a glance, not an audit.
