#!/usr/bin/env node
// Stop hook: when the agent is about to finish and source files changed this
// session, auto-trigger /okf-sync so the .knowledge bundle stays current
// without the user asking. Stays quiet unless:
//   - a .knowledge bundle exists in the repo, and
//   - the .okf-dirty marker is present (a real source edit happened), and
//   - we're not already inside a Stop-hook continuation (loop guard).
// When it fires it clears the marker (deterministic, loop-safe) and blocks the
// stop with a reason instructing the model to run /okf-sync, then finish.

import { readFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

let input = {};
try {
  input = JSON.parse(readStdin() || "{}");
} catch {
  process.exit(0);
}

// already continuing from a previous Stop-hook block -> let it stop (no loop)
if (input.stop_hook_active) process.exit(0);

const projectDir = input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
const knowledgeDir = join(projectDir, ".knowledge");

// no bundle -> nothing to sync
if (!existsSync(join(knowledgeDir, "index.md"))) process.exit(0);

// no source edits this session -> nothing to do
const dirtyPath = join(knowledgeDir, ".okf-dirty");
if (!existsSync(dirtyPath)) process.exit(0);

// clear the marker now so this fires at most once per dirty batch and can't loop
try {
  rmSync(dirtyPath);
} catch {
  // if we can't clear it, still proceed - stop_hook_active prevents a loop
}

process.stdout.write(
  JSON.stringify({
    decision: "block",
    reason:
      "Source files changed this session and the .knowledge bundle may be stale. " +
      "Run /okf-sync now: fold the behavioral changes into the matching concept files " +
      "(overwrite their bodies + restamp timestamps), refresh their lines in index.md, " +
      "and append a dated line to .knowledge/log.md. Skip concepts unaffected by trivial " +
      "edits. Then finish.",
  })
);
