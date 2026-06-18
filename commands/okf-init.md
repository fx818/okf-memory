---
description: Create the .knowledge/ OKF memory bundle for a repo that has none
---

Initialize an OKF cross-session memory bundle at `.knowledge/` in the current repo.

First load the `okf-memory` skill (and read its `references/format.md`) so you follow the bundle format exactly.

## Procedure

1. **Check for an existing bundle.** If `.knowledge/index.md` already exists, stop and tell the user it exists - suggest `/okf-sync` or `/okf-check` instead. Do not overwrite.

2. **Shallow structure scan only - do NOT read source files.** Map the repo's top **3 directory layers** (folder -> subfolder -> subfolder). That's it. The goal is to identify subsystems from structure, not to read code - reading the whole codebase is exactly the token cost this plugin exists to avoid. You may read shallow signal files if present: `README.md`, `package.json`/`pyproject.toml`/equivalent, and any existing `CLAUDE.md`/`AGENTS.md`.

3. **Infer subsystems** from the directory map + signal files. Each real subsystem becomes one candidate `arch-<area>.md`. Draft the project vocabulary for `glossary.md`.

4. **Ask only on genuine ambiguity.** If the structure plus signal files leave a real doubt (what a term means, which areas matter, project direction), ask the user a few targeted questions. Do not ask about things the structure already answers.

5. **Write the bundle** using the skill's templates (do NOT ask for approval first - just create it):
   - `.knowledge/index.md` (from `templates/index.md`) - one line per concept + open-threads section.
   - `.knowledge/glossary.md` (from `templates/glossary.md`).
   - `.knowledge/arch-<area>.md` per subsystem (from `templates/concept.md`).
   - `.knowledge/log.md` - start with a single line noting the bundle was initialized today.
   - Stamp every `timestamp` with today's date (UTC). Verify each claim against structure/signal files before writing it as truth - don't assert behavior you haven't grounded.

6. **Tell the user** what was created and that future sessions will auto-load `index.md`. Suggest committing `.knowledge/` so the memory travels with the repo.
