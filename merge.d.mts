import type { Config, ConfigExtension, DefaultClassGroupIds, DefaultThemeGroupIds } from "tailwind-merge";

/** Config extension object, for `extendTailwindMerge(safeInsets)`. */
export declare const safeInsets: ConfigExtension<DefaultClassGroupIds, DefaultThemeGroupIds>;

/** Config function, for `extendTailwindMerge(withSafeInsets)` alongside other plugins. */
export declare function withSafeInsets<ClassGroupIds extends string, ThemeGroupIds extends string>(
  config: Config<ClassGroupIds, ThemeGroupIds>,
): Config<ClassGroupIds, ThemeGroupIds>;
