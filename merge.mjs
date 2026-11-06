/**
 * tailwind-merge support for tailwind-safe-insets.
 *
 * Each safe utility joins the tailwind-merge class group of the core utility
 * that covers the same sides (pt-safe-4 → "pt", inset-x-safe → "inset-x", …),
 * so tailwind-merge's existing conflict rules apply unchanged:
 *
 *   twMerge("pt-4 pt-safe-4")                  → "pt-safe-4"
 *   twMerge("px-0 p-safe-4")                   → "p-safe-4"
 *   twMerge("p-safe-4 px-0")                   → "p-safe-4 px-0"   (px-0 only overrides two sides)
 *   twMerge("top-1/2 top-safe-1/2")            → "top-safe-1/2"
 *   twMerge("max-h-[90dvh] max-h-dvh-safe-4")  → "max-h-dvh-safe-4"
 *
 * Usage:
 *   import { extendTailwindMerge } from "tailwind-merge";
 *   import { withSafeInsets } from "tailwind-safe-insets/merge";
 *   export const twMerge = extendTailwindMerge(withSafeInsets);
 */
import { mergeConfigs } from "tailwind-merge";

// Everything after "<prefix>-safe-" (a number, a fraction, a theme token,
// "or-…", "[…]") belongs to the same group; the stylesheet decides whether it
// is valid.
const anyValue = () => true;

const SIDES = ["", "x", "y", "s", "e", "t", "r", "b", "l"];

const PREFIXES = [
  // padding, margin (negative variants are handled by tailwind-merge itself),
  // scroll padding and scroll margin
  ...["p", "m", "scroll-p", "scroll-m"].flatMap((base) => SIDES.map((side) => base + side)),
  // position
  "inset", "inset-x", "inset-y", "top", "right", "bottom", "left",
];

const classGroups = Object.fromEntries(
  PREFIXES.map((prefix) => [prefix, [{ [`${prefix}-safe`]: ["", anyValue] }]]),
);
// inset-s-* / inset-e-* belong to the "start" / "end" groups (named after the
// start-* / end-* utilities that Tailwind 4.2 deprecated in their favour).
classGroups.start = [{ "inset-s-safe": ["", anyValue] }];
classGroups.end = [{ "inset-e-safe": ["", anyValue] }];
// Viewport sizes: h-dvh-safe-4 → "h", max-w-dvw-safe-or-4 → "max-w", …
for (const g of ["h", "min-h", "max-h"]) classGroups[g] = [{ [`${g}-dvh-safe`]: ["", anyValue] }];
for (const g of ["w", "max-w"]) classGroups[g] = [{ [`${g}-dvw-safe`]: ["", anyValue] }];

/** Config extension object, for `extendTailwindMerge(safeInsets)`. */
export const safeInsets = { extend: { classGroups } };

/** Config function, for `extendTailwindMerge(withSafeInsets)` alongside other plugins. */
export function withSafeInsets(config) {
  return mergeConfigs(config, safeInsets);
}
