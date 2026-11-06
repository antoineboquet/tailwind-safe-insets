import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { build, root, rules } from "./helpers.mjs";

const read = (file) => readFileSync(path.join(root, file), "utf8");
const ours = (cls) => cls.includes("-safe") || cls.startsWith("safe-");
// sm:max-h-dvh-safe-8 → max-h-dvh-safe-8: variants do not change whether a utility exists.
const base = (cls) => cls.split(":").at(-1);
const backticked = (text) => [...text.matchAll(/`([^`]+)`/g)].flatMap((m) => m[1].split(/\s+/));

/** Rows of the Markdown table that follows `heading` in `text`, as arrays of cells. */
function table(text, heading) {
  const start = text.indexOf(heading);
  assert.ok(start >= 0, `missing section ${heading}`);
  const rows = [];
  for (const line of text.slice(start).split("\n").slice(1)) {
    if (line.startsWith("|")) rows.push(line.split("|").slice(1, -1).map((c) => c.trim()));
    else if (rows.length) break;
  }
  return rows.slice(2); // header and separator
}

test("every safe class in the README examples exists", async () => {
  const classes = [...read("README.md").matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)).filter(ours).map(base);
  assert.ok(classes.length > 20);
  const r = rules(await build(classes));
  assert.deepEqual(classes.filter((c) => !r.has(c)), []);
});

test("every class llms.txt recommends exists", async () => {
  const classes = table(read("llms.txt"), "## Choosing a class").flatMap(([, use]) => backticked(use)).filter(ours).map(base);
  assert.ok(classes.length > 10, classes.join(" "));
  const r = rules(await build(classes));
  assert.deepEqual(classes.filter((c) => !r.has(c)), []);
});

test("the classes llms.txt lists as non-existent do not exist", async () => {
  // Skip rows about a meaning ("pt-safe-4 meaning …"), whose class does exist.
  const rows = table(read("llms.txt"), "## Classes that do not exist").filter(([wrong]) => !wrong.includes("meaning"));
  const wrong = rows.flatMap(([w]) => backticked(w)).filter(ours);
  // Patterns such as left-safe-{a}/{b} are not classes.
  const replacements = rows.flatMap(([, use]) => backticked(use)).filter((c) => ours(c) && !c.includes("{"));
  assert.ok(wrong.length > 15, wrong.join(" "));
  const r = rules(await build([...wrong, ...replacements]));
  assert.deepEqual(wrong.filter((c) => r.has(c)), []);
  assert.deepEqual(replacements.filter((c) => !r.has(c)), []);
});

test("the README summary lists every section, in order, with GitHub's anchors", () => {
  const readme = read("README.md").replace(/```[\s\S]*?```/g, ""); // headings inside code blocks do not count
  // GitHub's anchor: lowercase, punctuation removed, spaces turned into hyphens.
  const slug = (title) => title.toLowerCase().replace(/[^\p{L}\p{N} _-]/gu, "").replace(/ /g, "-");
  const headings = [...readme.matchAll(/^(##|###) (.+)$/gm)]
    .map(([, level, title]) => ({ level: level.length, title }))
    .filter((h) => h.title !== "Summary");
  const summary = readme.slice(readme.indexOf("## Summary"), readme.indexOf("\n## ", readme.indexOf("## Summary") + 1));
  const entries = [...summary.matchAll(/^( *)\d+\. \[(.+)\]\(#(.+)\)$/gm)].map(([, indent, title, anchor]) => ({
    level: indent.length ? 3 : 2,
    title,
    anchor,
  }));
  assert.deepEqual(entries, headings.map((h) => ({ ...h, anchor: slug(h.title) })));
});
