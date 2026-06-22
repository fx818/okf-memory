#!/usr/bin/env node
// Stop hook: when the agent is about to finish and source files changed this
// session, auto-trigger /okf-sync so the .knowledge bundle stays current
// without the user asking. Stays quiet unless:
//   - a .knowledge bundle exists in the repo, and
//   - the .okf-dirty marker is present (a real source edit happened), and
//   - we're not already inside a Stop-hook continuation (loop guard).
// When it fires it clears the marker (deterministic, loop-safe) and blocks the
// stop with a reason instructing the model to run /okf-sync, then finish.

import { readFileSync, existsSync, rmSync, statSync, writeFileSync } from "node:fs";
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

// opt-out: OKF_AUTO_SYNC=0|false|off disables the forced stop-time sync. The
// PostToolUse nudge and .okf-dirty tracking still run, so /okf-sync stays manual.
const optOut = String(process.env.OKF_AUTO_SYNC || "").trim().toLowerCase();
if (["0", "false", "off", "no"].includes(optOut)) process.exit(0);

const projectDir = input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
const knowledgeDir = join(projectDir, ".knowledge");

// no bundle -> nothing to sync
if (!existsSync(join(knowledgeDir, "index.md"))) process.exit(0);

// no source edits this session -> nothing to do
const dirtyPath = join(knowledgeDir, ".okf-dirty");
if (!existsSync(dirtyPath)) process.exit(0);

// throttle: auto-sync at most once per 10 min so rapid edit/stop loops don't
// each trigger a sync. On a throttled skip, LEAVE .okf-dirty intact so the
// changed-file list keeps accumulating and syncs on the next eligible turn.
const THROTTLE_MS = 10 * 60 * 1000;
const syncStampPath = join(knowledgeDir, ".okf-last-sync");
try {
  if (existsSync(syncStampPath)) {
    const age = Date.now() - statSync(syncStampPath).mtimeMs;
    if (age < THROTTLE_MS) process.exit(0);
  }
} catch {
  // if we can't read the stamp, fall through and sync
}

// read the changed-file list so the sync can target only affected concepts
let changed = [];
try {
  changed = readFileSync(dirtyPath, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
} catch {
  changed = [];
}

// we're firing: stamp the sync time (starts the throttle window) and clear the
// marker so this fires at most once per dirty batch and can't loop.
try {
  writeFileSync(syncStampPath, String(Date.now()));
} catch {
  // best-effort; stop_hook_active still prevents a loop
}
try {
  rmSync(dirtyPath);
} catch {
  // if we can't clear it, still proceed - stop_hook_active prevents a loop
}

if (!changed.length) process.exit(0);

const fileList = changed.join(", ");
process.stdout.write(
  JSON.stringify({
    decision: "block",
    reason:
      "These files changed this session: " +
      fileList +
      ". Run a SURGICAL /okf-sync now - only for the concepts those files map to: " +
      "overwrite their bodies with current truth + restamp timestamps, refresh their " +
      "lines in index.md, and add a dated entry to .knowledge/log.md (under today's ## YYYY-MM-DD heading, newest-first). Do NOT re-scan " +
      "or re-verify the rest of the bundle. Skip entirely if these were trivial edits " +
      "(typos, formatting, pure refactors with no behavior change). Then finish.",
  })
);
