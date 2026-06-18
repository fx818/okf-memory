# OKF Bundle Format

The bundle is plain markdown + YAML. No runtime, no SDK, no database. It lives in version control alongside the code so it travels with the repo and reviews like code.

Based on the Open Knowledge Format (OKF v0.1): a *concept* is one markdown file, the file path is its identity, frontmatter makes it queryable, and cross-links form a graph.

## Concept file frontmatter

Every file in `.knowledge/` except `index.md` and `log.md` is a concept and carries exactly this frontmatter:

```markdown
---
type: architecture        # architecture | glossary | project | user | feedback | reference
title: Peers & Connections
description: Ping to accept to Peer; messaging per match
tags: [peers, connections, matching]
timestamp: 2026-06-18T00:00:00Z
---

Current-state body in present tense. Cross-link with [glossary](glossary.md)
or [matching](arch-matching.md) style links. Point to source for detail that
belongs in source - the concept says what and why, the code says how.
```

Field set is fixed - do not invent fields:

| Field | Meaning |
|---|---|
| `type` | one of the six values above |
| `title` | human name of the concept |
| `description` | one line; this is what shows in `index.md` |
| `tags` | lowercase keywords for grep/search |
| `timestamp` | ISO 8601 UTC; when this concept was last verified true |

### `type` values

- `architecture` - how a subsystem works (`arch-*.md`)
- `glossary` - vocabulary / domain terms
- `project` - direction, goals, constraints not derivable from code
- `user` - who the user is (role, preferences)
- `feedback` - how the agent should work in this repo (corrections, confirmed approaches)
- `reference` - pointer to an external resource (URL, dashboard, ticket)

## Body rules

- **Present tense, current truth only.** No "we changed X to Y" - that's history, it goes in `log.md`.
- **Overwritten in place** on change. Concept files are never append-only.
- **Compact.** If detail belongs in source code, link to it rather than copying it - copied detail drifts.
- **One fact, one file.** Link across concepts instead of duplicating.

## Size budgets (keep the bundle cheap to load)

The whole point is low token cost. Stay inside these budgets; over budget means tighten or split, never let it grow unbounded:

| File | Budget | If over |
|---|---|---|
| `index.md` concept line | one line, ≤ 15 words | shorten the description; detail lives in the concept |
| concept body | ≤ ~150 words (~30 lines) | tighten to current truth, or split into a second concept by sub-area |
| `index.md` total | ≤ ~40 concept lines | the repo likely has too many micro-concepts; merge related ones |

When overwriting a concept, rewrite the whole body to current truth - do not accrete. If a body keeps pushing the budget, that's the signal it covers two subsystems and should split.

## index.md

The map. The only file auto-loaded at session start. For each concept: name (linked), one-line description, freshness. Plus an open-threads / next-steps section so a resuming session knows where work stopped.

```markdown
# Knowledge Index

> Read this first. Open a concept file only when your task touches that area.

## Concepts
- [Glossary](glossary.md) - project vocabulary - 2026-06-18
- [Auth & Sessions](arch-auth.md) - login, session keep-alive - 2026-06-18
- [Peers & Connections](arch-peers.md) - Ping to accept to Peer - 2026-06-18

## Open threads
- (one line each: what's in flight, what's next)
```

## log.md

Append-only history. The OKF `log`. Not auto-loaded - consulted on demand when someone asks "when/why did this change". One line per entry, newest at the bottom (or top - be consistent):

```markdown
# Change Log
- 2026-06-18 - renamed Chats to Peers in UI; concept arch-peers.md updated
- 2026-06-18 - migration 023 de-junctioned dismissed_notifications; arch-notifications.md updated
```

## Deliberately NOT in scope (YAGNI)

For a single repo this stays flat and simple. Skip: deep nested directory hierarchies, producer/consumer conformance machinery, and splitting individual glossary terms into separate files. Adopt those only if a repo genuinely outgrows a flat bundle.
