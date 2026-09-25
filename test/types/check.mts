// Type-level test for the published merge.d.mts: run with `tsc -p test/types`.
import { extendTailwindMerge, twMerge } from "tailwind-merge";
import { safeInsets, withSafeInsets } from "tailwind-safe-insets/merge";

const viaFunction = extendTailwindMerge(withSafeInsets);
const viaObject = extendTailwindMerge(safeInsets);

// Composes with other extensions and custom class groups.
const composed = extendTailwindMerge<"custom-group">(
  { extend: { classGroups: { "custom-group": ["custom"] } } },
  withSafeInsets,
);

const results: string[] = [viaFunction("pt-4 pt-safe-4"), viaObject("p-safe"), composed("custom"), twMerge("p-2")];
void results;

// @ts-expect-error withSafeInsets takes a tailwind-merge config, not a string.
withSafeInsets("pt-safe");
