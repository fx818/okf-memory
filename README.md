# okf-memory

Portable cross-session memory for any repo, in the **Open Knowledge Format (OKF)**.

A bundle of markdown concept files lives in-repo at `.knowledge/`, so a fresh Claude Code session knows the codebase's vocabulary and architecture **without re-reading source files or making you re-explain terms every session.**

## The problem it solves

Start a new session and the agent knows nothing. It re-reads source to relearn the codebase (expensive in tokens) and you re-explain project terms again. Worse, ad-hoc memory tends to be stored as an *event log* ("renamed X to Y") that only accumulates and eventually contradicts itself, while the freshest truth sits in a file that never auto-loads.

## How it works

- **`.knowledge/index.md`** is a cheap progressive-disclosure map. It's the only file loaded at session start. The map alone usually answers "what do the terms mean / what's the shape".
- **`.knowledge/<concept>.md`** files hold current truth, one subsystem or topic each, present tense. Opened only when a task touches that area.
- **`.knowledge/log.md`** is append-only history - what changed, when. Not auto-loaded.
- Each concept carries its own `timestamp`, so freshness is **per fact** - re-verify only what's stale, not the whole bundle.

State (overwritten) is kept strictly apart from history (appended). That separation is what stops the rot.

## Components

| Piece | Role |
|---|---|
| `skills/okf-memory` | Loads on mutation (not every session): drill into a concept, overwrite + restamp after changes, re-verify stale. Read-only sessions use the SessionStart hook alone. |
| `/okf-init` | Create the bundle for a repo that has none. Shallow 3-layer structure scan only - never reads the whole codebase. |
| `/okf-sync` | Fold recent changes into concepts and restamp. |
| `/okf-check` | Audit for staleness, contradictions, coverage gaps. |
| SessionStart hook | Injects `.knowledge/index.md` if present, else hints to run `/okf-init`. |
| PostToolUse hook | Non-blocking, throttled nudge after source edits; records each changed file path in `.okf-dirty`. |
| Stop hook | If source changed this session, auto-runs a surgical `/okf-sync` (only the changed files' concepts) before the turn ends. |

## Install

```
/plugin marketplace add fx818/okf-memory
/plugin install okf-memory
```

Then in any repo:

```
/okf-init        # build the bundle (writes immediately, no approval prompt)
```

Commit `.knowledge/` so the memory travels with the repo. Add `.knowledge/.okf-last-nudge` and `.knowledge/.okf-dirty` to `.gitignore` (internal hook stamps).

## Format

It's just markdown + YAML - no runtime, no SDK, no database. Full spec in [`skills/okf-memory/references/format.md`](skills/okf-memory/references/format.md). Inspired by Google Cloud's Open Knowledge Format.
