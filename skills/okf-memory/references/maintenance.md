# Maintaining the Bundle

How to keep `.knowledge/` true over time. The cost of memory is upkeep - these workflows keep upkeep cheap and tied to moments you're already at.

## After a meaningful change

Trigger: you changed behavior, vocabulary, or architecture - the kind of thing a teammate would need told. (Skip for typos, formatting, or refactors that change nothing observable.)

1. **Find the concept.** One subsystem - one `arch-*.md`. Vocabulary - `glossary.md`. If no concept covers the area and it's a real subsystem now, create one from `templates/concept.md`.
2. **Overwrite the body** with the new current truth. Present tense. Delete anything no longer true - don't leave the old statement next to the new one.
3. **Restamp** `timestamp` to now (ISO 8601 UTC).
4. **Update `index.md`** if the one-line description changed.
5. **Append to `log.md`**: one dated line - what changed, which concept updated.

That's the whole loop. It's the same moment you'd commit or jot a note, so it's not a new habit.

## /okf-sync (batch update)

When several changes have piled up (or the post-edit nudge fired and you deferred), run the loop above for each affected area in one pass:
- Diff what changed since the bundle was last touched (git log / git diff against the concept timestamps).
- For each affected subsystem, do the after-a-change loop.
- Reconcile `index.md` so every concept line is current.

## /okf-check (audit)

Three checks, report findings - don't auto-fix without surfacing them:

1. **Freshness** - any concept whose `timestamp` predates the code it describes (compare against `git log` on the relevant paths). List stale concepts; offer to re-verify.
2. **Contradiction** - any two concepts (or a concept vs. the index line) that disagree. The freshest-timestamped wins; flag the loser.
3. **Coverage** - real subsystems in the repo with no concept file, and concept files for subsystems that no longer exist (delete those).

## Seeding truth - verify, don't trust

When building or repairing a concept, **verify each claim against current source before writing it as truth.** Existing memory may be stale. The classic failure: an auto-loaded file confidently states old vocabulary (e.g. a nav label that was since renamed), and every session inherits the lie. Confirm against code, then write.

## Anti-drift principle

Drift happens when the same fact lives in two places and only one gets updated. Defenses, in order of importance:
1. One fact, one file (link, don't copy).
2. State separate from history (overwrite concepts, append the log).
3. Per-concept timestamps (re-verify surgically, not wholesale).
4. The freshest truth is what auto-loads (the index), never a stale side file.
