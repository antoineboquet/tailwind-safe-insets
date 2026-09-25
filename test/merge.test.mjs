import { test } from "node:test";
import assert from "node:assert/strict";
import { extendTailwindMerge, twMerge as defaultTwMerge } from "tailwind-merge";
// Imported by package name to exercise the "exports" map.
import { safeInsets, withSafeInsets } from "tailwind-safe-insets/merge";
import { coreCandidates, coreOf, families, ourCandidates } from "./helpers.mjs";

const twMerge = extendTailwindMerge(withSafeInsets);

test("without the extension, tailwind-merge keeps conflicting safe classes", () => {
  assert.equal(defaultTwMerge("pt-4 pt-safe-4"), "pt-4 pt-safe-4");
});

test("both entry points give the same result", () => {
  const viaObject = extendTailwindMerge(safeInsets);
  for (const s of ["pt-4 pt-safe-4", "px-0 p-safe-4", "bottom-4 bottom-safe-or-4", "ps-2 ps-safe"]) {
    assert.equal(viaObject(s), twMerge(s), s);
  }
});

test("typical overrides resolve like their core counterparts", () => {
  const cases = {
    "pt-4 pt-safe-4": "pt-safe-4",
    "pt-safe-4 pt-2": "pt-2",
    "pt-safe-4 pt-safe-6": "pt-safe-6",
    "pb-safe pb-safe-or-4": "pb-safe-or-4",
    "pt-safe-[20px] pt-safe-sm": "pt-safe-sm",
    "px-0 p-safe-4": "p-safe-4",
    "p-safe-4 px-0": "p-safe-4 px-0",
    "px-safe-4 ps-2": "px-safe-4 ps-2",
    "ps-safe-4 ps-2": "ps-2",
    "pt-safe p-4": "p-4",
    "bottom-4 bottom-safe-or-4": "bottom-safe-or-4",
    "start-2 inset-s-safe": "inset-s-safe",
    "inset-e-safe end-2": "end-2",
    "left-0 inset-x-safe": "inset-x-safe",
    "-mx-4 -mx-safe-4": "-mx-safe-4",
    "mx-safe-4 -mx-safe-4": "-mx-safe-4",
    "scroll-pt-16 scroll-pt-safe-16": "scroll-pt-safe-16",
    "h-dvh h-dvh-safe": "h-dvh-safe",
    "min-h-screen min-h-dvh-safe": "min-h-dvh-safe",
    "md:pt-4 md:pt-safe-4": "md:pt-safe-4",
    "pt-4 md:pt-safe-4": "pt-4 md:pt-safe-4",
    "safe-b-none pb-safe-4": "safe-b-none pb-safe-4",
  };
  for (const [input, expected] of Object.entries(cases)) {
    assert.equal(twMerge(input), expected, input);
  }
});

test("every merge decision mirrors the one for the core counterparts", () => {
  // For any two utilities of a family, twMerge("A B") must keep or drop the
  // same classes as twMerge on their core counterparts. This holds whatever
  // the tailwind-merge version, since both sides use the same version.
  const outcome = (a, b, result) =>
    result === `${a} ${b}` ? "both" : result === b ? "second" : result === a ? "first" : `other: ${result}`;
  // Core classes this tailwind-merge version does not know (inset-s-* in
  // tailwind-merge 3.0, say) are left out, and our classes are compared with
  // the names it does know (start-*).
  const known = (name) => defaultTwMerge(`${name} ${name.replace(/-2$/, "-4")}`) === name.replace(/-2$/, "-4");
  const wrong = [];
  for (const family of Object.keys(families)) {
    const all = [...ourCandidates(family), ...coreCandidates(family).filter((c) => known(c.name))];
    for (const a of all) {
      for (const b of all) {
        if (a === b) continue;
        const ours = outcome(a.name, b.name, twMerge(`${a.name} ${b.name}`));
        const [ca, cb] = [coreOf(a, known), coreOf(b, known)];
        const core = ca === cb ? "second" : outcome(ca, cb, twMerge(`${ca} ${cb}`));
        if (ours !== core) wrong.push(`${a.name} ${b.name} → ${ours} (core ${ca} ${cb} → ${core})`);
      }
    }
  }
  assert.deepEqual(wrong.slice(0, 20), []);
});

test("core-only merges are unchanged by the extension", () => {
  for (const s of ["p-4 p-2", "px-2 p-4", "p-4 px-2", "ps-2 px-4", "inset-0 top-2", "top-2 inset-0", "-mt-2 mt-4", "h-full h-screen"]) {
    assert.equal(twMerge(s), defaultTwMerge(s), s);
  }
});
