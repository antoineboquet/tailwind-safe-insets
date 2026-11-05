# Changelog

## 0.2.0

### Added

- Viewport sizes with a margin. `h-dvh-safe`, `min-h-dvh-safe` and `max-h-dvh-safe` take the three forms (`max-h-dvh-safe-4`, `max-h-dvh-safe-or-4`). The value applies on each side: `max-h-dvh-safe-4` is `100dvh - (<top> + 1rem) - (<bottom> + 1rem)`.
- `w-dvw-safe` and `max-w-dvw-safe`, in the three forms, subtracting the left and right insets from `100dvw`.
- Fractions of the safe area on `top`, `right`, `bottom` and `left`: `top-safe-1/2` is the middle between the top and bottom insets, a drop-in replacement for `top-1/2` in modals centered with a translate.
- tailwind-merge: the new size classes join the `h`, `min-h`, `max-h`, `w` and `max-w` groups, so `twMerge("max-h-[calc(100dvh-2rem)] max-h-dvh-safe-4")` gives `max-h-dvh-safe-4`.

### Changed

- `top-safe-1/2` and the other fractions on the four physical sides used to generate nothing. They now generate CSS, with a meaning of their own: a fraction of the safe area, not inset plus value. `top-safe-[50%]` is unchanged.
- The viewport sizes read theme tokens from `--spacing-*` only, not from `--height-*`, `--max-height-*`, `--container-*` and the like, since the value is a gap and not a size.

The output of every utility that existed in 0.1.0 is unchanged.

## 0.1.0

First release.
