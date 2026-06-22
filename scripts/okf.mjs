#!/usr/bin/env node
// Deterministic OKF bundle tool. No model tokens, no deps.
//
//   node okf.mjs status [--dir <repo>]   compact bundle snapshot
//   node okf.mjs lint   [--dir <repo>]   format + size-budget + log-format checks
//
// Powers /okf-status and the cheap half of /okf-check. Freshness, contradiction,
// and coverage stay model-driven (they need git + judgement); everything that is
// a pure parse lives here so it costs nothing.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// ---- args -----------------------------------------------------------------
const argv = process.argv.slice(2);
const cmd = argv[0];
const dirFlag = argv.indexOf("--dir");
const projectDir = dirFlag !== -1 ? argv[dirFlag + 1] : process.cwd();
const K = join(projectDir, ".knowledge");

if (!["status", "lint"].includes(cmd)) {
  console.log("usage: node okf.mjs <status|lint> [--dir <repo>]");
  process.exit(2);
}
if (!existsSync(join(K, "index.md"))) {
  console.log("No .knowledge/ bundle here (index.md absent). Run /okf-init.");
  process.exit(1);
}

// ---- helpers --------------------------------------------------------------
const RESERVED = new Set(["index.md", "log.md"]);
const STD_TYPES = new Set([
  "architecture", "glossary", "project", "user", "feedback", "reference",
]);
// our-profile recommended fields; OKF itself only hard-requires `type`.
const RECOMMENDED = ["title", "description", "tags", "timestamp"];

function parseFrontmatter(text) {
  if (!text.startsWith("---")) return { fm: null, body: text };
  const end = text.indexOf("\n---", 3);
  if (end === -1) return { fm: null, body: text };
  const raw = text.slice(3, end).trim();
  const body = text.slice(end + 4).replace(/^\n/, "");
  const fm = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!m) continue;
    let [, key, val] = m;
    val = val.trim();
    if (val.startsWith("[") && val.endsWith("]")) {
      val = val.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean);
    }
    fm[key] = val;
  }
  return { fm, body };
}

function wordCount(body) {
  return body
    .replace(/<!--[\s\S]*?-->/g, " ")   // drop HTML comments
    .replace(/[#>*`_-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function listConcepts() {
  return readdirSync(K)
    .filter((f) => f.endsWith(".md") && !RESERVED.has(f))
    .map((f) => {
      const text = readFileSync(join(K, f), "utf8");
      const { fm, body } = parseFrontmatter(text);
      return { file: f, fm, body, words: wordCount(body) };
    });
}

function indexConceptLines() {
  const text = readFileSync(join(K, "index.md"), "utf8");
  return text.split("\n").filter((l) => /^\s*-\s*\[.+\]\(.+\)/.test(l));
}

// detect a pre-§7 log: has dated bullet lines but no `## YYYY-MM-DD` heading.
function logFormat() {
  const p = join(K, "log.md");
  if (!existsSync(p)) return "missing";
  const text = readFileSync(p, "utf8");
  const hasDateHeading = /^##\s+\d{4}-\d{2}-\d{2}/m.test(text);
  const hasFlatDated = /^\s*-\s*\d{4}-\d{2}-\d{2}\s/m.test(text);
  if (hasDateHeading) return "okf";
  if (hasFlatDated) return "legacy-flat";
  return "empty";
}

// ---- status ---------------------------------------------------------------
if (cmd === "status") {
  const concepts = listConcepts();
  const idxLines = indexConceptLines();
  const stamped = concepts
    .filter((c) => c.fm?.timestamp)
    .sort((a, b) => String(a.fm.timestamp).localeCompare(String(b.fm.timestamp)));
  const stalest = stamped[0];

  const dirtyPath = join(K, ".okf-dirty");
  let pending = [];
  if (existsSync(dirtyPath)) {
    pending = readFileSync(dirtyPath, "utf8").split("\n").map((l) => l.trim()).filter(Boolean);
  }

  console.log(`OKF bundle: ${K}`);
  console.log(`Concepts:   ${concepts.length}  (index lists ${idxLines.length})`);
  if (stalest) console.log(`Stalest:    ${stalest.file} @ ${stalest.fm.timestamp}`);
  console.log(`Log format: ${logFormat()}`);
  console.log(`Pending sync (.okf-dirty): ${pending.length ? pending.join(", ") : "none"}`);

  // budget flags
  const over = concepts.filter((c) => c.words > 150);
  if (over.length) console.log(`Over body budget (>150w): ${over.map((c) => `${c.file}(${c.words}w)`).join(", ")}`);
  if (idxLines.length > 40) console.log(`Index over budget: ${idxLines.length} concept lines (>40)`);
  process.exit(0);
}

// ---- lint -----------------------------------------------------------------
if (cmd === "lint") {
  const errors = [];
  const warnings = [];
  const concepts = listConcepts();

  for (const c of concepts) {
    if (!c.fm) { errors.push(`${c.file}: no parseable YAML frontmatter`); continue; }
    if (!c.fm.type) errors.push(`${c.file}: missing required \`type\` (OKF hard requirement)`);
    else if (!STD_TYPES.has(c.fm.type)) warnings.push(`${c.file}: non-standard type "${c.fm.type}" (allowed for interop; flag only)`);
    for (const f of RECOMMENDED) {
      if (!c.fm[f] || (Array.isArray(c.fm[f]) && !c.fm[f].length))
        warnings.push(`${c.file}: missing recommended field \`${f}\``);
    }
    if (c.fm.timestamp && !/^\d{4}-\d{2}-\d{2}/.test(String(c.fm.timestamp)))
      warnings.push(`${c.file}: timestamp not ISO 8601`);
    if (c.words > 150) warnings.push(`${c.file}: body ${c.words}w over ~150w budget (tighten or split)`);
  }

  const idxLines = indexConceptLines();
  for (const l of idxLines) {
    const words = l.replace(/^\s*-\s*/, "").split(/\s+/).filter(Boolean).length;
    if (words > 18) warnings.push(`index.md line over ~15 words: ${l.trim().slice(0, 60)}...`);
  }
  if (idxLines.length > 40) warnings.push(`index.md has ${idxLines.length} concept lines (>40 — merge micro-concepts)`);

  const lf = logFormat();
  if (lf === "legacy-flat")
    warnings.push("log.md is pre-§7 flat format — run /okf-check to migrate to date-grouped (`## YYYY-MM-DD`, newest-first)");

  console.log(`Lint: ${errors.length} error(s), ${warnings.length} warning(s)`);
  for (const e of errors) console.log(`  ERROR  ${e}`);
  for (const w of warnings) console.log(`  warn   ${w}`);
  process.exit(errors.length ? 1 : 0);
}
