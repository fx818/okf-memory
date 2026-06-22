#!/usr/bin/env node
// PostToolUse hook (Edit|Write|MultiEdit): a NON-BLOCKING nudge to keep the
// OKF bundle in sync after source edits. Stays quiet unless:
//   - a .knowledge bundle exists in the repo, and
//   - the edited file is real source (not inside .knowledge/ itself), and
//   - it hasn't nudged in the last 10 minutes (throttled to avoid spam).
// Exit 0 always - this never blocks a tool call.

import { readFileSync, existsSync, statSync, writeFileSync } from "node:fs";
import { join, relative, isAbsolute } from "node:path";

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

const projectDir = input.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
const knowledgeDir = join(projectDir, ".knowledge");

// no bundle -> nothing to keep in sync
if (!existsSync(join(knowledgeDir, "index.md"))) process.exit(0);

const filePath =
  input?.tool_input?.file_path || input?.tool_input?.path || "";
if (!filePath) process.exit(0);

// don't nudge about editing the memory bundle itself
const rel = isAbsolute(filePath) ? relative(projectDir, filePath) : filePath;
if (rel.startsWith(".knowledge")) process.exit(0);

// record the changed file in .okf-dirty so the Stop hook can run a SURGICAL
// sync (only the concepts mapping to these files) instead of re-scanning the
// bundle. Deduped newline list; not throttled - the Stop hook clears it.
try {
  const dirtyPath = join(knowledgeDir, ".okf-dirty");
  let existing = "";
  try {
    existing = readFileSync(dirtyPath, "utf8");
  } catch {
    existing = "";
  }
  const files = new Set(
    existing.split("\n").map((l) => l.trim()).filter(Boolean)
  );
  files.add(rel.split("\\").join("/"));
  writeFileSync(dirtyPath, Array.from(files).join("\n") + "\n");
} catch {
  // best-effort; never crash the tool call
}

// throttle: once per 10 minutes per repo
const THROTTLE_MS = 10 * 60 * 1000;
const stampPath = join(knowledgeDir, ".okf-last-nudge");
try {
  if (existsSync(stampPath)) {
    const age = Date.now() - statSync(stampPath).mtimeMs;
    if (age < THROTTLE_MS) process.exit(0);
  }
  writeFileSync(stampPath, String(Date.now()));
} catch {
  // if we can't write the stamp, still nudge - just don't crash
}

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext:
        "Reminder: if this and recent edits changed how the codebase behaves, " +
        "update the matching .knowledge concept (overwrite its body + restamp timestamp), " +
        "refresh its line in index.md, and add a dated entry to .knowledge/log.md (under today's ## YYYY-MM-DD heading, newest-first). " +
        "Run /okf-sync to do this for a batch of changes. Skip if these were trivial edits.",
    },
  })
);
