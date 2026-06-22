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

This is the **profile** we author in. OKF v0.1 itself requires only a non-empty `type`; everything else is optional. We keep all five for consistency and cheap indexing:

| Field | Required? | Meaning |
|---|---|---|
| `type` | **yes** (OKF hard requirement) | one of the six values above |
| `title` | profile | human name of the concept |
| `description` | profile | one line; this is what shows in `index.md` |
| `tags` | profile | lowercase keywords for grep/search |
| `timestamp` | profile | ISO 8601 UTC; when this concept was last verified true |
| `resource` | optional | canonical URI for an underlying asset, when the concept describes one (OKF-standard optional field) |

Stick to this set when authoring. For **interop** - consuming a bundle written elsewhere - OKF permits producer-defined types and extra key/value fields, so don't reject a foreign concept just because its `type` is `Table` or it carries unknown keys; `/okf-check` flags these, it doesn't error on them.

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

Append-only history. The OKF `log`. Not auto-loaded - consulted on demand when someone asks "when/why did this change".

Follows OKF §7: a flat list of **date-grouped entries, newest first**. Each date is an ISO 8601 `## YYYY-MM-DD` heading; under it, one bullet per change. Entries are prose - the leading bold word (`**Update**`, `**Creation**`, `**Deprecation**`, `**Rename**`, …) is a convention, not a requirement. Name the concept that changed.

```markdown
# Change Log

## 2026-06-18
* **Rename**: renamed Chats to Peers in UI; [arch-peers](arch-peers.md) updated.
* **Update**: migration 023 de-junctioned dismissed_notifications; [arch-notifications](arch-notifications.md) updated.

## 2026-06-17
* **Creation**: initialized the knowledge bundle.
```

New entries go under today's `## YYYY-MM-DD` heading at the **top** of the list (create the heading if today's isn't there yet). Never rewrite past entries - the log is history.

## Citations & external references

A concept may cite an external source with a normal markdown link - an absolute URL, or a bundle-relative path. For a source worth mirroring (an RFC, an API contract, a design doc), OKF's convention is a `references/` subdirectory whose files are themselves concepts (`type: reference`), so the external material becomes first-class and greppable instead of a bare URL that rots. Use this only when a link genuinely needs to travel with the repo; a plain URL is fine otherwise.

## Deliberately NOT in scope (YAGNI)

For a single repo this stays flat and simple. Skip: deep nested directory hierarchies, producer/consumer conformance machinery, and splitting individual glossary terms into separate files. Adopt those only if a repo genuinely outgrows a flat bundle.
