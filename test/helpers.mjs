import path from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "@tailwindcss/node";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const spacing = (p) => ({
  ours: [p, `${p}x`, `${p}y`, `${p}s`, `${p}e`, `${p}t`, `${p}r`, `${p}b`, `${p}l`],
  // Core shapes include block-logical ones (pbs, pbe) that only newer
  // Tailwind versions generate; tests keep the ones the installed version knows.
  core: [p, `${p}x`, `${p}y`, `${p}s`, `${p}e`, `${p}bs`, `${p}be`, `${p}t`, `${p}r`, `${p}b`, `${p}l`],
});

/** Families of utilities: our shapes and the core shapes they sit among. */
export const families = {
  padding: { ...spacing("p"), negative: false },
  margin: { ...spacing("m"), negative: true },
  position: {
    ours: ["inset", "inset-x", "inset-y", "inset-s", "inset-e", "top", "right", "bottom", "left"],
    core: ["inset", "inset-x", "inset-y", "start", "end", "inset-s", "inset-e", "inset-bs", "inset-be", "top", "right", "bottom", "left"],
    negative: false,
  },
  "scroll-padding": { ...spacing("scroll-p"), negative: false },
  "scroll-margin": { ...spacing("scroll-m"), negative: false },
};

export const toggles = {
  "safe-none": ["top", "right", "bottom", "left"],
  "safe-x-none": ["left", "right"],
  "safe-y-none": ["top", "bottom"],
  "safe-t-none": ["top"],
  "safe-r-none": ["right"],
  "safe-b-none": ["bottom"],
  "safe-l-none": ["left"],
};

const FORMS = ["-safe", "-safe-2", "-safe-or-2"];

/** Our utilities in a family, as { name, shape, family } with a sample value. */
export function ourCandidates(family) {
  const { ours, negative } = families[family];
  const out = [];
  for (const shape of ours) {
    for (const form of FORMS) {
      out.push({ name: `${shape}${form}`, shape, family });
      if (negative) out.push({ name: `-${shape}${form}`, shape: `-${shape}`, family });
    }
  }
  return out;
}

/** Core utilities in a family, as { name, shape, family }. */
export function coreCandidates(family) {
  const { core, negative } = families[family];
  const out = [];
  for (const shape of core) {
    out.push({ name: `${shape}-2`, shape, family });
    if (negative) out.push({ name: `-${shape}-2`, shape: `-${shape}`, family });
  }
  return out;
}

// inset-s-* / inset-e-* replaced start-* / end-* in Tailwind 4.2; older
// versions (of Tailwind or tailwind-merge) only know the old names.
const ALIASES = { "inset-s": "start", "inset-e": "end" };

/**
 * The core utility with the same shape: px-safe-or-2 → px-2, -mx-safe → -mx-2.
 * `known(name)` tells whether the installed version has that class; when it
 * does not, the pre-4.2 alias is used (inset-s-2 → start-2).
 */
export function coreOf(c, known = () => true) {
  const name = `${c.shape}-2`;
  return !known(name) && ALIASES[c.shape] ? `${ALIASES[c.shape]}-2` : name;
}

/** Every utility the README documents, with a sample value where needed. */
export const documented = [
  ...Object.keys(families).flatMap((f) => ourCandidates(f).map((c) => c.name)),
  "h-dvh-safe",
  "min-h-dvh-safe",
  "max-h-dvh-safe",
  ...Object.keys(toggles),
];

export async function build(candidates, theme = "") {
  const css = [
    '@import "tailwindcss/theme" theme(reference);',
    '@import "tailwindcss/utilities";',
    '@import "./index.css";',
    theme && `@theme { ${theme} }`,
  ].join("\n");
  const compiler = await compile(css, { base: root, onDependency() {} });
  // Tailwind >= 4.0.17 adds a fallback to var(--spacing); normalise it away.
  return compiler.build(candidates).replaceAll("var(--spacing, 0.25rem)", "var(--spacing)");
}

function parseDecls(text) {
  return text
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const i = d.indexOf(":");
      return [d.slice(0, i).trim(), d.slice(i + 1).trim()];
    });
}

/**
 * Parse top-level class rules, in output order, into
 * Map<className, { decls: [property, value][], nested: Map<selector, [property, value][]> }>.
 */
export function parse(css) {
  const out = new Map();
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open < 0) break;
    const selector = css.slice(i, open).trim().split("\n").at(-1).trim();
    let depth = 1;
    let j = open + 1;
    while (depth > 0 && j < css.length) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
      j++;
    }
    const body = css.slice(open + 1, j - 1);
    i = j;
    if (!selector.startsWith(".")) continue;
    const name = selector.slice(1).replace(/\\(.)/g, "$1");
    const nested = new Map();
    let flat = "";
    let k = 0;
    while (k < body.length) {
      const nOpen = body.indexOf("{", k);
      if (nOpen < 0) {
        flat += body.slice(k);
        break;
      }
      const lastSemi = body.lastIndexOf(";", nOpen);
      const selStart = Math.max(lastSemi + 1, k);
      flat += body.slice(k, selStart);
      const nSel = body.slice(selStart, nOpen).trim();
      const nClose = body.indexOf("}", nOpen);
      nested.set(nSel, parseDecls(body.slice(nOpen + 1, nClose)));
      k = nClose + 1;
    }
    out.set(name, { decls: parseDecls(flat), nested });
  }
  return out;
}

/** Top-level declarations only: Map<className, [property, value][]>. */
export function rules(css) {
  return new Map([...parse(css)].map(([k, v]) => [k, v.decls]));
}

/** Declarations applied under the rtl variant: Map<className, [property, value][]>. */
export function rtlRules(css) {
  const out = new Map();
  for (const [k, v] of parse(css)) {
    for (const [sel, decls] of v.nested) if (sel.includes("dir(rtl)")) out.set(k, decls);
  }
  return out;
}

/** The value that wins the cascade for `prop` inside one rule. */
export function winning(decls, prop) {
  return decls?.filter(([p]) => p === prop).at(-1)?.[1];
}

/** The inset expression every utility uses for one side. */
export const ins = (side) => `var(--safe-inset-${side}, env(safe-area-inset-${side}, 0px))`;
