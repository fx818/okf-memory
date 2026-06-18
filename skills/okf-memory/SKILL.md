---
name: okf-memory
description: Use at the start of any session in a repo with a .knowledge/ bundle, and whenever you make changes that alter how the codebase works. Cross-session memory in Open Knowledge Format - read the index first, drill into concept files on demand, overwrite + restamp concepts after changes. Keeps a fresh session from re-reading source to relearn vocabulary and architecture.
---

# OKF Memory

Cross-session memory stored as an **Open Knowledge Format (OKF)** bundle inside the repo at `.knowledge/`. The point: a fresh session should know the codebase's vocabulary and architecture from cheap markdown, instead of re-reading source files (token-expensive) or making the user re-explain terms every session.

## What the bundle is

```
.knowledge/
  index.md         # progressive-disclosure map - the ONLY file loaded at session start
  glossary.md      # project vocabulary (one concept)
  arch-<area>.md   # one concept file per real subsystem
  log.md           # append-only history (what changed, when) - NOT auto-loaded
```

Each concept is **one markdown file**. The file path is its identity. See [references/format.md](references/format.md) for the exact frontmatter and rules; [references/maintenance.md](references/maintenance.md) for the update workflow.

## The two-line model that makes this work

| | State | History |
|---|---|---|
| **Holds** | current truth, present tense | dated record of what happened |
| **Files** | `index.md` + concept files | `log.md` |
| **On change** | **overwritten in place** | appended only |
| **Auto-loads** | yes (index) | no |

The single most common failure of memory systems is storing **events** ("renamed X to Y on June 16") as if they were **state**. Events only accumulate - they never get corrected, so they rot and contradict. Keep state and history strictly apart: concept bodies say what *is*, `log.md` says what *happened*.

## Discipline (follow every session)

### 1. Read the index first, drill on demand
At session start, read `.knowledge/index.md` only. It lists every concept with a one-line description and a freshness stamp. That map alone usually answers "what do the terms mean / what's the shape" without opening any concept file. Open a concept file **only when** the task actually touches that area. Never read the whole bundle up front, and never re-read source to relearn something a concept already records.

If there is no `.knowledge/` directory, tell the user they can run `/okf-init` to create one. Do not silently scan the codebase.

### 2. After a change that alters how the code works, update the concept
When you change behavior, vocabulary, or architecture (not for typo fixes or pure refactors that change nothing observable):
1. **Overwrite** the affected concept file's body with the new current truth - present tense, no event narration.
2. **Restamp** that concept's `timestamp` to now.
3. If its one-line description changed, update that line in `index.md`.
4. **Append** one dated line to `log.md` recording what changed.

This rides the same moment you'd already use to commit or note a change - it is not a separate habit to remember. Full procedure in [references/maintenance.md](references/maintenance.md).

### 3. Trust fresh, re-verify stale
Each concept carries its own `timestamp`, so freshness is per-fact. When a concept looks older than the code it describes and you're about to rely on it, re-verify **only that one concept** against source, then overwrite + restamp. Don't re-verify the whole bundle.

### 4. One fact, one place
A fact lives in exactly one concept file. If two files would state it, link instead of duplicating: `[glossary](glossary.md)`. Cross-links between concepts form a graph richer than the folder tree - use them.

## Commands

- `/okf-init` - create the bundle for a repo that has none (shallow 3-layer structure scan, infer subsystems, confirm, then write).
- `/okf-sync` - fold recent changes into concepts and restamp (use after a batch of work, or when the post-edit nudge fires).
- `/okf-check` - audit the bundle for staleness, contradictions, and coverage gaps.

## Red flags

| Thought | Reality |
|---|---|
| "Let me read the source to learn the architecture" | Read `index.md` first - that's why it exists. |
| "I'll append what changed to the concept file" | Concepts are overwritten, not appended. Append to `log.md`. |
| "I'll note the date in the concept body" | Dates go in frontmatter `timestamp` and in `log.md`, never in the body. |
| "The whole bundle might be stale, let me re-verify all of it" | Re-verify only the specific concept you're about to trust. |
| "I'll record this fact in both files to be safe" | One fact, one file. Duplication is how drift starts. |
