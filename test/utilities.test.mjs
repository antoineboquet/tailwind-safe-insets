import { test } from "node:test";
import assert from "node:assert/strict";
import {
  build,
  coreCandidates,
  coreOf,
  documented,
  families,
  ins,
  ourCandidates,
  parse,
  rtlRules,
  rules,
  toggles,
  winning,
} from "./helpers.mjs";

test("bare utilities apply the inset alone", async () => {
  const css = await build(["pt-safe", "px-safe", "p-safe", "mb-safe", "bottom-safe", "inset-x-safe"]);
  const r = rules(css);
  assert.deepEqual(r.get("pt-safe"), [["padding-top", ins("top")]]);
  assert.deepEqual(r.get("px-safe"), [["padding-inline", `${ins("left")} ${ins("right")}`]]);
  assert.deepEqual(r.get("p-safe"), [
    ["padding", `${ins("top")} ${ins("right")} ${ins("bottom")} ${ins("left")}`],
  ]);
  assert.deepEqual(r.get("mb-safe"), [["margin-bottom", ins("bottom")]]);
  assert.deepEqual(r.get("bottom-safe"), [["bottom", ins("bottom")]]);
  assert.deepEqual(r.get("inset-x-safe"), [["inset-inline", `${ins("left")} ${ins("right")}`]]);
});

test("-safe-{n} adds the spacing scale to the inset", async () => {
  const r = rules(await build(["pt-safe-4", "pb-safe-1.5", "mt-safe-0", "top-safe-2", "scroll-pt-safe-16"]));
  assert.equal(winning(r.get("pt-safe-4"), "padding-top"), `calc(${ins("top")} + calc(var(--spacing) * 4))`);
  assert.equal(winning(r.get("pb-safe-1.5"), "padding-bottom"), `calc(${ins("bottom")} + calc(var(--spacing) * 1.5))`);
  assert.equal(winning(r.get("mt-safe-0"), "margin-top"), `calc(${ins("top")} + calc(var(--spacing) * 0))`);
  assert.equal(winning(r.get("top-safe-2"), "top"), `calc(${ins("top")} + calc(var(--spacing) * 2))`);
  assert.equal(
    winning(r.get("scroll-pt-safe-16"), "scroll-padding-top"),
    `calc(${ins("top")} + calc(var(--spacing) * 16))`,
  );
});

test("off-scale bare numbers are rejected, like core utilities", async () => {
  const r = rules(await build(["pt-safe-1.37", "pt-1.37", "pt-safe-or-1.37", "top-safe-1.37"]));
  assert.equal(r.has("pt-1.37"), false);
  assert.equal(r.has("pt-safe-1.37"), false);
  assert.equal(r.has("pt-safe-or-1.37"), false);
  assert.equal(r.has("top-safe-1.37"), false);
});

test("theme spacing tokens are supported", async () => {
  const css = await build(["pt-safe-sm", "pt-safe-or-sm", "bottom-safe-sm", "ps-safe-sm"], "--spacing-sm: 0.75rem;");
  const r = rules(css);
  assert.equal(winning(r.get("pt-safe-sm"), "padding-top"), `calc(${ins("top")} + var(--spacing-sm))`);
  assert.equal(winning(r.get("pt-safe-or-sm"), "padding-top"), `max(${ins("top")}, var(--spacing-sm))`);
  assert.equal(winning(r.get("bottom-safe-sm"), "bottom"), `calc(${ins("bottom")} + var(--spacing-sm))`);
  assert.equal(winning(rtlRules(css).get("ps-safe-sm"), "padding-inline-start"), `calc(${ins("right")} + var(--spacing-sm))`);
});

test("a theme override of a numeric step wins, matching core utilities", async () => {
  const css = await build(["pt-4", "pt-safe-4", "pt-safe-or-4", "p-safe-4", "px-safe-4"], "--spacing-4: 3rem;");
  const r = rules(css);
  assert.equal(winning(r.get("pt-4"), "padding-top"), "var(--spacing-4)");
  assert.equal(winning(r.get("pt-safe-4"), "padding-top"), `calc(${ins("top")} + var(--spacing-4))`);
  assert.equal(winning(r.get("pt-safe-or-4"), "padding-top"), `max(${ins("top")}, var(--spacing-4))`);
  assert.ok(winning(r.get("p-safe-4"), "padding").startsWith(`calc(${ins("top")} + var(--spacing-4))`));
  assert.ok(winning(rtlRules(css).get("px-safe-4"), "padding-inline").startsWith(`calc(${ins("right")} + var(--spacing-4))`));
});

test("a theme without --spacing still compiles, and its tokens work", async () => {
  // A fixed-scale design system removes --spacing. Importing the package must
  // not break the build; theme tokens resolve as in core utilities.
  const css = await build(["pt-1", "pt-safe-1", "pt-safe-or-card"], "--*: initial; --spacing-1: 4px; --padding-card: 2rem;");
  const r = rules(css);
  assert.equal(winning(r.get("pt-1"), "padding-top"), "var(--spacing-1)");
  assert.equal(winning(r.get("pt-safe-1"), "padding-top"), `calc(${ins("top")} + var(--spacing-1))`);
  assert.equal(winning(r.get("pt-safe-or-card"), "padding-top"), `max(${ins("top")}, var(--padding-card))`);
});

test("each utility reads the same theme token as its core counterpart", async () => {
  // Core utilities look up their own namespace (--padding-*, --margin-*,
  // --inset-*, --scroll-padding-*, --scroll-margin-*) before --spacing-*.
  const theme = [
    "--spacing-4: 3rem; --spacing-sm: 0.75rem;",
    "--padding-4: 5rem; --padding-card: 2rem;",
    "--margin-4: 6rem; --margin-gutter: 5rem;",
    "--inset-4: 7rem; --inset-bar: 4rem;",
    "--scroll-padding-4: 8rem; --scroll-padding-hdr: 4rem;",
    "--scroll-margin-4: 9rem; --scroll-margin-hdr: 2rem;",
  ].join(" ");
  const tokens = ["4", "sm", "card", "gutter", "bar", "hdr"];
  const cands = [];
  for (const family of Object.keys(families)) {
    for (const c of ourCandidates(family).filter((c) => c.name.endsWith("-safe"))) {
      for (const t of tokens) cands.push({ c, t, ours: `${c.name}-${t}`, core: `${c.shape}-${t}`, alias: coreOf(c, () => false).replace(/-2$/, `-${t}`) });
    }
  }
  const r = rules(await build(cands.flatMap((x) => [x.ours, x.core, x.alias]), theme));
  const themeVars = (value) => new Set([...value.matchAll(/var\((--(?!safe-inset)[\w-]+)/g)].map((m) => m[1]));
  const wrong = [];
  for (const { ours, core: name, alias } of cands) {
    const core = r.has(name) ? name : alias;
    if (!r.has(core)) {
      if (r.has(ours)) wrong.push(`${ours} is generated but ${core} is not`);
      continue;
    }
    if (!r.has(ours)) {
      wrong.push(`${ours} is missing (${core} exists)`);
      continue;
    }
    const expected = [...themeVars(r.get(core).at(-1)[1])];
    for (const prop of new Set(r.get(ours).map(([p]) => p))) {
      const got = themeVars(winning(r.get(ours), prop));
      if (expected.some((v) => !got.has(v))) wrong.push(`${ours} (${prop}) reads ${[...got]}, ${core} reads ${expected}`);
    }
  }
  assert.deepEqual(wrong.slice(0, 20), []);
});

test("arbitrary values (a single value) are supported", async () => {
  const cases = {
    "pt-safe-[20px]": "20px",
    "pt-safe-[2%]": "2%",
    "pt-safe-[var(--gap)]": "var(--gap)",
    "pt-safe-[calc(1rem+2px)]": "calc(1rem + 2px)",
  };
  const r = rules(await build(Object.keys(cases)));
  for (const [cls, v] of Object.entries(cases)) {
    assert.equal(winning(r.get(cls), "padding-top"), `calc(${ins("top")} + ${v})`, cls);
  }
});

test("-safe-or-{n} takes the larger of the inset and the value", async () => {
  const r = rules(await build(["pb-safe-or-8", "pb-safe-or-[2rem]", "pr-safe-or-4", "bottom-safe-or-4"]));
  assert.equal(winning(r.get("pb-safe-or-8"), "padding-bottom"), `max(${ins("bottom")}, calc(var(--spacing) * 8))`);
  assert.equal(winning(r.get("pb-safe-or-[2rem]"), "padding-bottom"), `max(${ins("bottom")}, 2rem)`);
  assert.equal(winning(r.get("pr-safe-or-4"), "padding-right"), `max(${ins("right")}, calc(var(--spacing) * 4))`);
  assert.equal(winning(r.get("bottom-safe-or-4"), "bottom"), `max(${ins("bottom")}, calc(var(--spacing) * 4))`);
});

test("position utilities cover inset, inset-x, inset-y, inset-s, inset-e and each side", async () => {
  const css = await build(["inset-safe-2", "inset-y-safe", "inset-s-safe-4", "right-safe-or-4", "left-safe-[1rem]"]);
  const r = rules(css);
  const two = (s) => `calc(${ins(s)} + calc(var(--spacing) * 2))`;
  assert.deepEqual(r.get("inset-safe-2"), [["inset", `${two("top")} ${two("right")} ${two("bottom")} ${two("left")}`]]);
  assert.deepEqual(r.get("inset-y-safe"), [["inset-block", `${ins("top")} ${ins("bottom")}`]]);
  assert.equal(winning(r.get("inset-s-safe-4"), "inset-inline-start"), `calc(${ins("left")} + calc(var(--spacing) * 4))`);
  assert.equal(winning(rtlRules(css).get("inset-s-safe-4"), "inset-inline-start"), `calc(${ins("right")} + calc(var(--spacing) * 4))`);
  assert.equal(winning(r.get("right-safe-or-4"), "right"), `max(${ins("right")}, calc(var(--spacing) * 4))`);
  assert.equal(winning(r.get("left-safe-[1rem]"), "left"), `calc(${ins("left")} + 1rem)`);
});

test("negative margins mirror the three forms", async () => {
  const css = await build(["-mx-safe-4", "-mt-safe", "-mb-safe-or-2", "-m-safe-[1rem]", "-ms-safe"]);
  const r = rules(css);
  const four = (s) => `calc((${ins(s)} + calc(var(--spacing) * 4)) * -1)`;
  assert.equal(winning(r.get("-mx-safe-4"), "margin-inline"), `${four("left")} ${four("right")}`);
  assert.equal(winning(rtlRules(css).get("-mx-safe-4"), "margin-inline"), `${four("right")} ${four("left")}`);
  assert.deepEqual(r.get("-mt-safe"), [["margin-top", `calc(${ins("top")} * -1)`]]);
  assert.equal(
    winning(r.get("-mb-safe-or-2"), "margin-bottom"),
    `calc(max(${ins("bottom")}, calc(var(--spacing) * 2)) * -1)`,
  );
  assert.ok(winning(r.get("-m-safe-[1rem]"), "margin").startsWith(`calc((${ins("top")} + 1rem) * -1) `));
  assert.deepEqual(rtlRules(css).get("-ms-safe"), [["margin-inline-start", `calc(${ins("right")} * -1)`]]);
});

test("safe-*-none zero the inset variables for a subtree", async () => {
  const r = rules(await build(Object.keys(toggles)));
  const byName = ([a], [b]) => a.localeCompare(b);
  for (const [cls, sides] of Object.entries(toggles)) {
    assert.deepEqual(
      [...r.get(cls)].sort(byName),
      sides.map((s) => [`--safe-inset-${s}`, "0px"]).sort(byName),
      cls,
    );
  }
});

test("every inset is read through its --safe-inset-* variable", async () => {
  const css = await build(documented);
  const envs = css.match(/env\(safe-area-inset-/g).length;
  const vars = css.match(/var\(--safe-inset-(top|right|bottom|left), env\(safe-area-inset-\1, 0px\)\)/g).length;
  assert.equal(envs, vars);
});

test("h-dvh-safe subtracts the top and bottom insets", async () => {
  const r = rules(await build(["h-dvh-safe", "min-h-dvh-safe"]));
  assert.deepEqual(r.get("h-dvh-safe"), [["height", `calc(100dvh - ${ins("top")} - ${ins("bottom")})`]]);
  assert.deepEqual(r.get("min-h-dvh-safe"), [["min-height", `calc(100dvh - ${ins("top")} - ${ins("bottom")})`]]);
});

test("every documented utility generates CSS", async () => {
  const r = rules(await build(documented));
  const missing = documented.filter((c) => !r.has(c));
  assert.deepEqual(missing, []);
});

/** Which insets a property must read, in LTR and (for inline properties) in RTL. */
function expectedSides(prop) {
  const physical = prop.match(/(?:^|-)(top|right|bottom|left)$/);
  if (physical) return { ltr: [physical[1]], rtl: null };
  if (/-inline-start$/.test(prop)) return { ltr: ["left"], rtl: ["right"] };
  if (/-inline-end$/.test(prop)) return { ltr: ["right"], rtl: ["left"] };
  if (/-inline$/.test(prop)) return { ltr: ["left", "right"], rtl: ["right", "left"] };
  if (/-block$/.test(prop)) return { ltr: ["top", "bottom"], rtl: null };
  if (["padding", "margin", "inset", "scroll-padding", "scroll-margin"].includes(prop)) {
    return { ltr: ["top", "right", "bottom", "left"], rtl: null };
  }
  return null;
}

const sidesIn = (value) => [...value.matchAll(/--safe-inset-(\w+)/g)].map((m) => m[1]);

test("each side reads the right inset, in LTR and in RTL", async () => {
  const css = await build(documented);
  const rtl = rtlRules(css);
  for (const [cls, { decls }] of parse(css)) {
    if (cls.includes("dvh") || cls.startsWith("safe-")) continue;
    const props = new Set(decls.map(([p]) => p));
    assert.equal(props.size, 1, `${cls} writes a single property`);
    const [prop] = props;
    const expected = expectedSides(prop);
    assert.ok(expected, `${cls}: unexpected property ${prop}`);
    for (const [, value] of decls) assert.deepEqual(sidesIn(value), expected.ltr, `${cls} (ltr)`);
    if (expected.rtl) {
      assert.ok(rtl.has(cls), `${cls} needs an rtl variant`);
      for (const [p, value] of rtl.get(cls)) {
        assert.equal(p, prop, `${cls} (rtl property)`);
        assert.deepEqual(sidesIn(value), expected.rtl, `${cls} (rtl)`);
      }
    } else {
      assert.equal(rtl.has(cls), false, `${cls} should not change under rtl`);
    }
  }
});

test("each utility writes the same property as its core counterpart", async () => {
  const ours = Object.keys(families).flatMap(ourCandidates);
  const all = [...ours.map((c) => c.name), ...ours.map((c) => coreOf(c)), "start-2", "end-2"];
  const r = rules(await build(all));
  const known = (name) => r.has(name);
  const wrong = [];
  for (const c of ours) {
    const core = coreOf(c, known);
    const mineProps = new Set(r.get(c.name).map(([p]) => p));
    const coreProps = new Set(r.get(core).map(([p]) => p));
    if ([...mineProps].join() !== [...coreProps].join()) wrong.push(`${c.name}: ${[...mineProps]} vs ${core}: ${[...coreProps]}`);
  }
  assert.deepEqual(wrong, []);
});

test("stylesheet order matches core, so overrides behave like p-4 / px-2 / ps-0", async () => {
  // For any two utilities of a family with different shapes, their relative
  // order in the stylesheet must be the same as for their core counterparts.
  // This covers every mix: physical and logical sides, core and safe classes.
  const wrong = [];
  for (const family of Object.keys(families)) {
    const all = [...ourCandidates(family), ...coreCandidates(family)];
    const r = rules(await build([...all.map((c) => c.name), "start-2", "end-2"]));
    const order = [...r.keys()];
    const known = (name) => r.has(name);
    const coreOfKnown = (c) => coreOf(c, known);
    const present = all.filter((c) => known(c.name) && known(coreOfKnown(c)));
    const props = (c) => r.get(coreOfKnown(c)).map(([p]) => p).join();
    for (const a of present) {
      for (const b of present) {
        // Same property (px-safe vs px-2, start-safe vs its alias inset-s-2):
        // combining them is a conflict in core too, with no defined winner.
        if (props(a) === props(b)) continue;
        const ours = Math.sign(order.indexOf(a.name) - order.indexOf(b.name));
        const core = Math.sign(order.indexOf(coreOfKnown(a)) - order.indexOf(coreOfKnown(b)));
        if (ours !== core) wrong.push(`${a.name} vs ${b.name} (core: ${coreOfKnown(a)} vs ${coreOfKnown(b)})`);
      }
    }
  }
  assert.deepEqual(wrong.slice(0, 20), []);
});
