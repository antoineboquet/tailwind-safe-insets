# Working on tailwind-safe-insets

Notes for contributors and coding agents. To *use* the library in another project, read [llms.txt](llms.txt) instead.

## Layout

| Path | What it is |
| --- | --- |
| `index.css` | The whole library: Tailwind v4 `@utility` blocks, edited by hand. |
| `merge.mjs`, `merge.d.mts` | The optional tailwind-merge 3 extension and its types. |
| `test/helpers.mjs` | Shared test data: families, sizes, fractions, the `documented` class list, the `build()` compiler. |
| `test/utilities.test.mjs` | Generated CSS: values, insets read, properties, sort order. |
| `test/merge.test.mjs` | tailwind-merge decisions, compared with the core counterparts. |
| `test/types/` | Type check of the published helper. |
| `docs/figures/build.mjs` | Generates the README figures (`*.light.svg`, `*.dark.svg`). |
| `README.md` | Human documentation. |
| `llms.txt` | Reference for coding assistants, shipped in the npm package. |
| `CHANGELOG.md` | One section per release. |

## Invariants

Changes must keep these. The tests check most of them.

- **The inset is always read the same way.** Every utility reads it as `var(--safe-inset-<side>, env(safe-area-inset-<side>, 0px))`, never `env()` alone, so that `safe-none` and custom insets apply.
- **Same property as core.** Each utility writes the same property as its Tailwind counterpart (`px-safe` writes `padding-inline`, like `px-4`), so stylesheet order and overrides match core.
- **Three forms with fixed meanings.** `-safe` is the inset, `-safe-{value}` is inset **plus** value, `-safe-or-{value}` is the **larger** of the two. Do not change these meanings.
- **Declaration order inside a functional utility:**
  1. the spacing number, with the `var(--spacing, 0.25rem)` fallback;
  2. `--value(--spacing-*)`;
  3. the family token (`--padding-*`, `--inset-*`…);
  4. the arbitrary value;
  5. the fraction, on `top`, `right`, `bottom` and `left` only.

  The last declaration that resolves wins.
- **Exceptions to the family token rule:**
  - Viewport sizes read `--spacing-*` only, never size namespaces (`--height-*`, `--container-*`…).
  - Fractions mean a fraction of the safe area, not inset plus value.
- **Direction:**
  - `x`, `s` and `e` utilities swap the left and right insets under `&:where(:dir(rtl))`.
  - Physical sides, `y` utilities, viewport sizes and fractions have no RTL variant.
- **Compatibility:**
  - Everything must work on Tailwind 4.0.0, the lowest version in the peer range, and on the latest release.
  - Avoid `@utility` features newer than 4.0.0, such as `--value('literal')`, accepted only from 4.0.16.
- **Existing output does not change** unless the change is intended and listed in the CHANGELOG.

## Testing

```bash
npm test                                                        # installed Tailwind and tailwind-merge
npm install --no-save tailwindcss@4.0.0 @tailwindcss/node@4.0.0 && npm test   # lowest supported Tailwind
npm install --no-save tailwind-merge@3.0.0 && npm test          # lowest supported tailwind-merge
npm ci                                                          # back to the locked versions
```

CI runs the tests on Tailwind 4.0.0 and the latest release, then smoke-tests the packed tarball.

When adding or renaming a utility:

1. Add it to `index.css`, following the neighbouring blocks.
2. Add it to the shared data in `test/helpers.mjs` (`families`, `sizes`, `fractionCandidates` or `documented`), so that the generic tests cover it. Add value tests for anything new.
3. Put it in the right class group in `merge.mjs`, and add a case in `test/merge.test.mjs`.
4. Document it in `README.md` and `llms.txt`, including the "Classes that do not exist" table in `llms.txt` if a plausible name is not supported.
5. Add a CHANGELOG entry.

When a change affects a figure, edit `docs/figures/build.mjs`, run `node docs/figures/build.mjs` and commit the regenerated SVGs. Do not edit the SVGs by hand. The figures compute their geometry from real values (390 × 844, 59px and 34px insets), so keep them true to the CSS.

## Release

1. Bump the version: `npm version <x.y.z> --no-git-tag-version`.
2. Move the CHANGELOG entries under that version.
3. Merge to `main`.
4. Push a tag `v<x.y.z>`: the publish workflow checks that the tag matches `package.json` and publishes to npm with provenance.

## Writing style

- Documentation is in English, short sentences, present tense.
- Show classes in examples rather than describing them.
- Back every claim about browser behaviour with a test or a check in a real browser, and say which browser.
