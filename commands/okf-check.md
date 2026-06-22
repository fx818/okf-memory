---
description: Audit the .knowledge/ bundle for staleness, contradictions, and gaps
---

Audit the OKF memory bundle. Report findings; do not silently rewrite - surface issues and let the user decide, unless they ask you to fix.

Load the `okf-memory` skill and read its `references/maintenance.md` first.

## Step 0 - run the deterministic lint (free, no model parsing)

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/okf.mjs" lint
```

If `$CLAUDE_PLUGIN_ROOT` is unset, find the `okf-memory` plugin dir and run `scripts/okf.mjs` from there. This covers **format** and **size-budget** checks (#4, #5 below) and flags a `legacy-flat` log deterministically, so you don't spend tokens parsing frontmatter. Fold its ERROR/warn lines into your report; only do the checks below by hand.

## Checks

1. **Freshness.** For each concept, compare its `timestamp` against `git log` on the paths it describes. List any concept older than the code it covers. Offer to re-verify each against source, then overwrite + restamp.

2. **Contradiction.** Compare concepts against each other and against their `index.md` line. Flag any disagreement. The freshest `timestamp` is presumed correct; call out the stale side.

3. **Coverage.**
   - Real subsystems (from the 3-layer structure) with no concept file - propose creating them.
   - Concept files for subsystems that no longer exist - propose deleting them.

4. **Format.** (Mostly from the lint.) Every concept must have a non-empty `type` (OKF's only hard requirement) and parseable frontmatter; missing `type` is an **error**. Our profile also expects `title`, `description`, `tags`, `timestamp` - missing ones are **warnings**, not errors. A non-standard `type` or an extra field like `resource:` is **allowed** (OKF permits producer-defined types and fields for cross-org interop) - note it, don't reject it.

5. **Size budget** (see `references/format.md`). Flag any concept body over ~150 words / ~30 lines, any `index.md` line over 15 words, or an `index.md` with more than ~40 concepts. Propose tightening or splitting - an oversized concept usually covers two subsystems.

6. **Log format (§7 migration).** If the lint reports `log.md is pre-§7 flat format`, the bundle predates the date-grouped log convention. Offer to migrate: regroup the existing flat `- YYYY-MM-DD - ...` lines under `## YYYY-MM-DD` headings, newest date first, one bullet per entry (prose, optional `**Update**`/`**Rename**` lead word). Preserve every existing entry - this is a reformat, not a rewrite. See `references/format.md` and `templates/log.md`.

## Output

A short report: stale concepts, contradictions (with which side wins), coverage gaps, format/lint issues, and whether a log migration is needed. End with the specific fixes you'd apply and ask whether to apply them.
