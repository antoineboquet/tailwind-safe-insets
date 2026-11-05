# tailwind-safe-insets

Safe-area-aware padding, margin, positioning, scroll offsets and viewport sizes for Tailwind CSS v4, with the full Tailwind value syntax.

```html
<header class="sticky top-0 pt-safe-4 px-safe-4">…</header>
<main class="px-safe-4 pb-safe-6">…</main>
<button class="fixed bottom-safe-or-4 right-safe-4">+</button>
```

- **Every value Tailwind accepts**: `pt-safe-4`, `pt-safe-1.5`, `pt-safe-sm` (theme token), `pt-safe-[20px]`, `pt-safe-[var(--gap)]`.
- **Two explicit behaviours**: `pt-safe-4` *adds* the spacing to the inset, `pt-safe-or-4` uses *whichever is larger*.
- **Padding, margin (including negative), position and scroll offsets**: `p*-safe`, `m*-safe`, `-m*-safe`, `inset*-safe`, `top-safe`, `scroll-p*-safe`, `scroll-m*-safe`…
- **Viewport sizes and centering for overlays**: `max-h-dvh-safe-4` keeps a gap inside the insets, `top-safe-1/2` is the middle of the safe area.
- **Opt out per subtree**: `safe-none`, `safe-b-none`… zero the insets for a component that does not touch the screen edge.
- **Behaves like core utilities**: each one writes the same CSS property as its Tailwind counterpart, so theme overrides such as `--spacing-4` apply and overrides work the same way: `p-safe-4 px-0` like `p-4 px-0`, `px-safe-4 ps-2` like `px-4 ps-2`.
- **tailwind-merge support**: an optional helper teaches `twMerge` / `cn()` which classes conflict.
- **RTL-aware**: insets are physical (a left notch stays on the left), so `px-safe` keeps each inset on its side in RTL, and the logical `ps-safe` / `pe-safe` / `inset-s-safe` / `inset-e-safe` read the inset on the start or end side.
- Tested in CI against Tailwind CSS 4.0.0 and the latest release. The tailwind-merge helper is tested in CI against tailwind-merge 3.7 and was checked against 3.0.0 for this release.

## Installation

```bash
npm install tailwind-safe-insets
```

```css
@import "tailwindcss";
@import "tailwind-safe-insets";
```

Browsers report non-zero insets only when the page extends under the device chrome, so add `viewport-fit=cover` to your viewport meta tag:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

## Adding the inset or taking the larger value?

Each utility comes in three forms. On an iPhone held upright, the home indicator inset is about 34px; on a desktop browser, every inset is 0.

| Class          | CSS                                           | iPhone (34px inset) | Desktop |
| -------------- | --------------------------------------------- | ------------------- | ------- |
| `pb-safe`      | `env(safe-area-inset-bottom)`                 | 34px                | 0       |
| `pb-safe-6`    | `calc(env(safe-area-inset-bottom) + 1.5rem)`  | 58px                | 24px    |
| `pb-safe-or-6` | `max(env(safe-area-inset-bottom), 1.5rem)`    | 34px                | 24px    |

- Use **`-safe-{value}`** when content needs its usual breathing room *in addition* to the device chrome: headers, text blocks, page gutters.
- Use **`-safe-or-{value}`** when the inset already provides enough room and you only want a minimum: tab bars, floating buttons, sticky footers.

## Utilities

| Padding | Margin | Position   | Scroll padding | Scroll margin | Sides                                   |
| ------- | ------ | ---------- | -------------- | ------------- | --------------------------------------- |
| `p-`    | `m-`   | `inset-`   | `scroll-p-`    | `scroll-m-`   | all                                     |
| `px-`   | `mx-`  | `inset-x-` | `scroll-px-`   | `scroll-mx-`  | left and right                          |
| `py-`   | `my-`  | `inset-y-` | `scroll-py-`   | `scroll-my-`  | top and bottom                          |
| `ps-`   | `ms-`  | `inset-s-` | `scroll-ps-`   | `scroll-ms-`  | inline start (left in LTR, right in RTL) |
| `pe-`   | `me-`  | `inset-e-` | `scroll-pe-`   | `scroll-me-`  | inline end (right in LTR, left in RTL)  |
| `pt-`   | `mt-`  | `top-`     | `scroll-pt-`   | `scroll-mt-`  | top                                     |
| `pr-`   | `mr-`  | `right-`   | `scroll-pr-`   | `scroll-mr-`  | right                                   |
| `pb-`   | `mb-`  | `bottom-`  | `scroll-pb-`   | `scroll-mb-`  | bottom                                  |
| `pl-`   | `ml-`  | `left-`    | `scroll-pl-`   | `scroll-ml-`  | left                                    |

Each prefix takes the three forms: `pt-safe`, `pt-safe-{value}` and `pt-safe-or-{value}`.

The position utilities follow Tailwind 4.2+ naming: `inset-s-safe` and `inset-e-safe`, since Tailwind deprecated `start-*` and `end-*` in favour of `inset-s-*` and `inset-e-*`. They work with every Tailwind 4 version.

**Negative margins** take the same three forms (`-mx-safe`, `-mx-safe-4`, `-mx-safe-or-4`). They let a child bleed to the screen edge through a safe-padded container:

```html
<article class="px-safe-4">
  <p>…</p>
  <figure class="-mx-safe-4">
    <img class="w-full" src="…" alt="" />
  </figure>
</article>
```

**Scroll offsets** keep anchor targets and snap points clear of the device chrome. A sticky header whose height includes the top inset hides the target of an anchor link unless the scroll container reserves the same space:

```html
<html class="scroll-pt-safe-16">
  <body>
    <header class="sticky top-0 h-16 box-content pt-safe">…</header>
    …
    <h2 id="pricing">…</h2>  <!-- /#pricing lands right below the header -->
  </body>
</html>
```

In a horizontal carousel with scroll snapping, `scroll-px-safe-4` on the scroller keeps snapped items out from under a landscape notch.

**Viewport sizes** subtract the insets from the dynamic viewport, for full-screen app shells and for overlays that must stay clear of the device chrome. They take the three forms, and the value applies **on each side**, as with `py-safe-4` (`<top>` and `<bottom>` stand for the insets):

| Class                 | CSS                                                      |
| --------------------- | -------------------------------------------------------- |
| `max-h-dvh-safe`      | `calc(100dvh - <top> - <bottom>)`                        |
| `max-h-dvh-safe-4`    | `calc(100dvh - (<top> + 1rem) - (<bottom> + 1rem))`      |
| `max-h-dvh-safe-or-4` | `calc(100dvh - max(<top>, 1rem) - max(<bottom>, 1rem))`  |

- Heights: `h-dvh-safe`, `min-h-dvh-safe` and `max-h-dvh-safe` subtract the top and bottom insets from `100dvh`.
- Widths: `w-dvw-safe` and `max-w-dvw-safe` subtract the left and right insets from `100dvw`. There is no `min-w-dvw-safe`.
- Theme tokens come from `--spacing-*` only. Core `max-w-lg` reads `--container-lg` (32rem) and `max-h-sm` reads `--max-height-sm`: those are sizes, while the value here is a gap subtracted twice. So `max-w-dvw-safe-lg` generates nothing unless you define `--spacing-lg`.
- `100dvw`, like `100vw`, includes a classic desktop scrollbar, so `w-dvw-safe-4` is slightly too wide on a page that scrolls. When that matters, size the element with insets instead: `fixed inset-x-safe-4 mx-auto w-fit`.

### Centering in the safe area

`top-1/2 -translate-y-1/2` centers in the viewport, so a tall modal can reach the status bar at the top and the rounded corners at the bottom. `top`, `right`, `bottom` and `left` take a fraction, which means a fraction **of the safe area**, measured from its edge:

| Class            | CSS                                                       |
| ---------------- | --------------------------------------------------------- |
| `top-safe-1/2`   | `top: calc(<top> + (100% - <top> - <bottom>) * 1/2)`      |
| `left-safe-1/2`  | `left: calc(<left> + (100% - <left> - <right>) * 1/2)`    |
| `top-safe-1/3`   | `top: calc(<top> + (100% - <top> - <bottom>) * 1/3)`      |

`top-safe-1/2` is the middle between the top and bottom insets. Use it instead of `top-1/2` and keep the translate:

```html
<div class="fixed top-safe-1/2 left-safe-1/2 -translate-x-1/2 -translate-y-1/2
            w-dvw-safe-4 max-w-lg max-h-dvh-safe-4 sm:max-h-dvh-safe-8 overflow-y-auto">…</div>
```

- A fraction does not mean *inset plus value*, since inset + 50% is never the middle. `top-safe-[50%]` keeps that meaning.
- Only the four physical sides take fractions, and not in the `-or-` form. Centering pairs with a translate, which is physical, so there is no `inset-s-safe-1/2`.
- `100%` is the size of the containing block, while the insets are those of the screen. The result is right for a `fixed` element, or an `absolute` one whose containing block covers the screen. A `fixed` element inside an ancestor with `transform`, `filter`, `backdrop-filter`, `perspective`, `contain: paint` or `will-change: transform` is positioned against that ancestor instead.
- Pair a fraction with the additive cap (`max-h-dvh-safe-4`), whose box has the same middle, so both gaps are exact. With the `-or-` cap, the gaps come out unequal when only one inset is smaller than the gap (8px at the top and 29px at the bottom for an iPhone in landscape, instead of 16px and 21px).

For the `-or-` behaviour, center without a transform, the way browsers center a modal `<dialog>`: with both insets set, a `fit-content` size and `auto` margins, the gaps are equal by construction.

```html
<div class="fixed inset-safe-or-4 m-auto w-fit h-fit max-w-lg max-h-dvh-safe-or-4 overflow-y-auto">…</div>
```

Keep the `max-h-dvh-safe-or-4`: `h-fit` follows the content, so without a cap a tall modal overflows the screen instead of scrolling. `height: fit-content` needs Firefox 94 or later.

### Accepted values

| Kind                   | Example                                   |
| ---------------------- | ----------------------------------------- |
| Spacing scale          | `pt-safe-4`, `pt-safe-1.5`, `pt-safe-or-0` |
| Theme tokens           | `pt-safe-sm`, read like `pt-sm`: `--padding-sm` if defined, else `--spacing-sm` |
| One arbitrary value    | `pt-safe-[20px]`, `pt-safe-[2%]`, `pt-safe-[var(--gap)]` |
| Fractions              | `top-safe-1/2`, `left-safe-1/3`: a fraction of the safe area, on `top`, `right`, `bottom` and `left` only (see [Centering](#centering-in-the-safe-area)) |

Theme tokens follow the same lookup as the core utility: `--padding-*` for `p*-safe`, `--margin-*` for `m*-safe`, `--inset-*` for the position utilities, `--scroll-padding-*` and `--scroll-margin-*` for the scroll ones, then `--spacing-*`. The viewport sizes are the exception: they read `--spacing-*` only.

An arbitrary value must be a single value, since the inset is added to it: `p-safe-[1rem_2rem]` produces invalid CSS, so write `py-safe-[1rem] px-safe-[2rem]` instead.

If your theme removes `--spacing` (a fixed scale defined with `--*: initial`), core utilities reject bare numbers such as `pt-3`, but `pt-safe-3` falls back to Tailwind's default 0.25rem step. Your theme tokens (`pt-safe-1` with `--spacing-1` defined) resolve as usual.

Not supported: negative values other than margins (`-top-safe-4`, `-scroll-mt-safe-4`), fractions outside `top`, `right`, `bottom` and `left` (`inset-y-safe-1/2`), `auto`, and the `px` keyword (use `[1px]`).

There are no block-logical utilities (`pbs-safe`, `mbe-safe`, `inset-bs-safe`…) on purpose. In horizontal writing modes, block start is the top, so `pt-safe` does the same job. In vertical writing modes, block start is on the right or the left, and CSS cannot tell a utility which writing mode applies, so a `pbs-safe` would put the top inset on the wrong side. They still combine correctly with Tailwind's own `pbs-*`, `mbe-*`… utilities.

## Right-to-left layouts

Safe-area insets are physical: in landscape, the notch is on the left or the right whatever the text direction. So:

- `pl-safe`, `pr-safe`, `left-safe`… always read the inset on their own side.
- `px-safe`, `mx-safe`, `inset-x-safe` keep the left inset on the left and the right inset on the right in RTL too.
- `ps-safe`, `pe-safe`, `ms-safe`, `me-safe`, `inset-s-safe`, `inset-e-safe` read the inset on the start or end side: the left inset in LTR, the right one in RTL.

Direction is detected with `:dir(rtl)`, the same direction the browser uses for `padding-inline-start` and friends. An LTR island inside an RTL page (`<div dir="ltr">`) therefore reads the left inset for its start side, as it should. `:dir()` follows the `dir` attribute, not the CSS `direction` property, and needs Safari 16.4+, Chrome 120+ or Firefox 49+. Older browsers apply the LTR sides.

`py-safe`, `my-safe`, `inset-y-safe` write `*-block` properties, like their Tailwind counterparts. In a vertical writing mode (`writing-mode: vertical-rl`), they would apply the top and bottom insets to the left and right sides.

## Opting out inside a component

A utility cannot know whether its element actually touches the screen edge. A footer with `pb-safe-4` is right at the bottom of the page, but adds a useless 34px when the same component is rendered inside a drawer or a card.

`safe-none` sets every inset to 0 for an element and all its descendants. Per-side variants are `safe-x-none`, `safe-y-none`, `safe-t-none`, `safe-r-none`, `safe-b-none` and `safe-l-none`.

```html
<aside class="drawer safe-none">
  <footer class="pb-safe-4">…</footer>  <!-- behaves like pb-4 here -->
</aside>
```

Under the hood, every utility reads `var(--safe-inset-<side>, env(safe-area-inset-<side>, 0px))`. You can set `--safe-inset-top`, `--safe-inset-right`, `--safe-inset-bottom` and `--safe-inset-left` yourself, for example from a native bridge in a webview where `env()` is unreliable:

```css
:root {
  --safe-inset-top: var(--native-safe-top);
  --safe-inset-bottom: var(--native-safe-bottom);
}
```

To switch an inset back on for an element inside a `safe-none` subtree, reset its variable with an arbitrary property: `[--safe-inset-bottom:initial]` returns to the device inset (`env()`). It also bypasses any value you set on `:root` yourself.

## tailwind-merge

[tailwind-merge](https://github.com/dcastil/tailwind-merge) (and the `cn()` helper built on it) does not know these classes, so `twMerge("pt-4 pt-safe-4")` keeps both and the stylesheet decides, not the order you wrote. When a component lets callers override its classes, their override can silently lose.

The optional helper puts each safe utility in the same group as the core utility that covers the same sides:

```ts
import { extendTailwindMerge } from "tailwind-merge";
import { withSafeInsets } from "tailwind-safe-insets/merge";

export const twMerge = extendTailwindMerge(withSafeInsets);

twMerge("pt-4 pt-safe-4");   // "pt-safe-4"
twMerge("px-0 p-safe-4");    // "p-safe-4"
twMerge("p-safe-4 px-0");    // "p-safe-4 px-0" (px-0 still wins on left and right)
twMerge("top-1/2 top-safe-1/2");                      // "top-safe-1/2"
twMerge("max-h-[calc(100dvh-2rem)] max-h-dvh-safe-4");  // "max-h-dvh-safe-4"
```

Without the helper, a safe class sometimes wins anyway because of where it sorts in the stylesheet (`top-safe-1/2` comes after `top-1/2`), but that is incidental: a component library that merges classes with its own tailwind-merge instance needs the extension passed to that instance.

`withSafeInsets` composes with other plugins (`extendTailwindMerge(withSafeInsets, withOtherPlugin)`). If you prefer a config object, `safeInsets` works too: `extendTailwindMerge(safeInsets)`. Requires tailwind-merge 3.

The helper is an ES module. From CommonJS, `require("tailwind-safe-insets/merge")` needs Node 20.19+ or 22.12+. In TypeScript, the types resolve with `moduleResolution` set to `bundler`, `nodenext` or `node`; with `node16`, import the helper from an ES module.

## Comparison with other packages

Other Tailwind packages handle safe areas. Pick the one that fits what you need (compared in September 2026):

|                                  | **tailwind-safe-insets** | [tailwindcss-safe-area] 1.3.0 | [tailwindcss-padding-safe] 2.0.0 |
| -------------------------------- | ------------------------ | ----------------------------- | -------------------------------- |
| Scope                            | padding, margin, position (with fractions of the safe area), scroll padding/margin, `dvh` heights, `dvw` widths | padding, margin, scroll padding/margin, position, heights (`vh`/`dvh`/`svh`/`lvh`), borders | padding, margin |
| Inset **plus** value             | `pt-safe-4`              | `pt-safe-offset-4`            | —                                |
| **Larger** of inset and value    | `pt-safe-or-4`           | `pt-safe-or-4`                | `pt-safe-4`                      |
| Fractional steps (`1.5`)         | ✓                        | ✗ (integers only)             | ✓                                |
| Theme tokens (`sm`)              | ✓                        | ✗                             | ✓                                |
| Arbitrary values (`[20px]`)      | ✓                        | ✗                             | ✓                                |
| Per-subtree opt-out              | ✓ (`safe-none`…)         | ✓ (`safe-none`…)              | ✗                                |
| `ps-safe` in RTL                 | right inset              | left inset                    | —                                |
| tailwind-merge helper            | ✓                        | ✗                             | ✗                                |
| Delivery                         | CSS `@import`            | CSS `@import`                 | JS `@plugin`                     |

If you need borders or `svh`/`lvh` heights, `tailwindcss-safe-area` covers more ground.

If you migrate from `tailwindcss-padding-safe`, note that the same class does not mean the same thing: `pt-safe-4` means *larger of* there and *plus* here. Rename its classes to `pt-safe-or-4`.

[tailwindcss-safe-area]: https://github.com/mvllow/tailwindcss-safe-area
[tailwindcss-padding-safe]: https://github.com/desaintflorent/tailwindcss-padding-safe

## Tailwind core

[Discussion #20200](https://github.com/tailwindlabs/tailwindcss/discussions/20200) proposes built-in `*-safe` and `*-safe-*` utilities with the same additive meaning as this package. As of September 2026, the Tailwind team has not responded to it. If they adopt it, you should be able to remove this package while keeping most of your class names.

## Development

```bash
npm install
npm test
```

The tests compile the utilities with Tailwind and check the generated CSS: values, the inset read on each side in LTR and RTL, a theme without `--spacing`, and that every utility writes the same property, reads the same theme token and sorts in the same order as its Tailwind counterpart. The viewport sizes and fractions are checked against the core utilities they stand in for (`max-h-*`, `top-1/2`…), and the viewport sizes against size tokens they must not read. The tests also check that every tailwind-merge decision matches the one for the core counterparts, and type-check the helper.

## License

[MIT](LICENSE) (C) 2026 Antoine Boquet
