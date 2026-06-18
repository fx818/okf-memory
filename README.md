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
| `skills/okf-memory` | Always-on discipline: read index first, drill on demand, overwrite + restamp after changes, re-verify stale. |
| `/okf-init` | Create the bundle for a repo that has none. Shallow 3-layer structure scan only - never reads the whole codebase. |
| `/okf-sync` | Fold recent changes into concepts and restamp. |
| `/okf-check` | Audit for staleness, contradictions, coverage gaps. |
| SessionStart hook | Injects `.knowledge/index.md` if present, else hints to run `/okf-init`. |
| PostToolUse hook | Non-blocking, throttled nudge to update concepts after source edits. |

## Install

```
/plugin marketplace add <this-repo-url>
/plugin install okf-memory
```

Then in any repo:

```
/okf-init        # build the bundle (asks before writing)
```

Commit `.knowledge/` so the memory travels with the repo. Add `.knowledge/.okf-last-nudge` to `.gitignore` (it's just a throttle stamp).

## Format

It's just markdown + YAML - no runtime, no SDK, no database. Full spec in [`skills/okf-memory/references/format.md`](skills/okf-memory/references/format.md). Inspired by Google Cloud's Open Knowledge Format.
