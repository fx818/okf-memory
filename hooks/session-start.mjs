#!/usr/bin/env node
// SessionStart hook: inject .knowledge/index.md (cheap map) so the session
// starts knowing the codebase. If no bundle exists, hint to run /okf-init.
// Loads ONLY the index - concept files are drilled into on demand by the skill.

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

let projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
try {
  const input = JSON.parse(readStdin() || "{}");
  if (input.cwd) projectDir = input.cwd;
} catch {
  // ignore malformed stdin, fall back to env/cwd
}

const indexPath = join(projectDir, ".knowledge", "index.md");

let additionalContext;
if (existsSync(indexPath)) {
  let index = "";
  try {
    index = readFileSync(indexPath, "utf8");
  } catch {
    index = "";
  }
  additionalContext =
    "OKF cross-session memory found. This is the knowledge index - the current-truth map of this repo. " +
    "Read it before exploring source. Open a concept file (.knowledge/<name>.md) only when your task touches that area. " +
    "After changes that alter behavior/vocabulary/architecture, update the relevant concept (overwrite + restamp) and append to .knowledge/log.md.\n\n" +
    "----- .knowledge/index.md -----\n" +
    index;
} else {
  additionalContext =
    "No OKF memory bundle found (.knowledge/index.md is absent). " +
    "If this repo would benefit from cross-session memory, suggest the user run /okf-init to create one. " +
    "Do NOT scan the whole codebase to build context on your own.";
}

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext,
    },
  })
);
