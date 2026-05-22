// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { componentKeys } from "../contract";
import {
  baseTokenBundle,
  contrastTokenOverrides,
  densityTokenScales,
  flattenComponentTokens,
  forcedColorsTokenOverrides,
  motionTokenScales,
} from "../tokens";
import type {
  DesignSystemConfig,
  DesignSystemWarning,
  RecipeManifest,
  ResolveDesignSystemRuntimeOptions,
  ResolvedComponentConfig,
  ResolvedDesignSystem,
  ThemeManifest,
} from "../types";

const resolveThemeTokens = (
  theme: ThemeManifest,
  effectiveScheme: "light" | "dark",
  variant: string | null,
): Record<string, string> => {
  const schemeTokens =
    effectiveScheme === "dark"
      ? (theme.schemes.dark?.tokens ?? theme.schemes.light.tokens)
      : theme.schemes.light.tokens;

  const variantTokens =
    variant && theme.variants?.[variant]?.baseScheme === effectiveScheme
      ? theme.variants[variant].tokens
      : {};

  return {
    ...theme.sharedTokens,
    ...schemeTokens,
    ...variantTokens,
  };
};

const componentPrefixes = componentKeys.map((key) => [`--mlf-${key}-`, key] as const);

/**
 * Single-pass bucketing: iterate tokens once, match each against component
 * prefixes. O(tokens) instead of O(tokens × componentKeys).
 */
const resolveComponentTokens = (
  tokens: Record<string, string>,
): Record<(typeof componentKeys)[number], ResolvedComponentConfig> => {
  const buckets = Object.fromEntries(
    componentKeys.map((key) => [key, {} as Record<string, string>]),
  ) as Record<(typeof componentKeys)[number], Record<string, string>>;

  for (const [token, value] of Object.entries(tokens)) {
    for (const [prefix, key] of componentPrefixes) {
      if (token.startsWith(prefix)) {
        buckets[key][token] = value;
        break;
      }
    }
  }

  return Object.fromEntries(componentKeys.map((key) => [key, { tokens: buckets[key] }])) as Record<
    (typeof componentKeys)[number],
    ResolvedComponentConfig
  >;
};

export const resolveTokens = (
  config: DesignSystemConfig,
  theme: ThemeManifest,
  recipe: RecipeManifest,
  effectiveScheme: "light" | "dark",
  requestedMode: ResolvedDesignSystem["requestedMode"],
  effectiveModeSource: ResolvedDesignSystem["effectiveModeSource"],
  warnings: DesignSystemWarning[],
  runtimeOptions: ResolveDesignSystemRuntimeOptions = {},
): ResolvedDesignSystem => {
  // Respect prefers-contrast unless the consumer explicitly overrides density.
  const density =
    config.overrides?.density ?? (runtimeOptions.prefersMoreContrast ? "spacious" : recipe.density);
  // Respect prefers-reduced-motion unless the consumer explicitly overrides motion.
  const motion =
    config.overrides?.motion ?? (runtimeOptions.prefersReducedMotion ? "none" : recipe.motion);

  const tokenOverrides = {
    ...config.overrides?.tokens,
    ...flattenComponentTokens(config.overrides?.components ?? {}),
  };

  // Resolve theme variant: explicit config.variant, or auto-select
  // "high-contrast-${scheme}" when prefers-contrast is active.
  const resolvedVariant =
    (config.variant && theme.variants?.[config.variant]?.baseScheme === effectiveScheme
      ? config.variant
      : null) ??
    (runtimeOptions.prefersMoreContrast && theme.variants?.[`high-contrast-${effectiveScheme}`]
      ? `high-contrast-${effectiveScheme}`
      : null);

  const contrastLayer = runtimeOptions.prefersMoreContrast ? contrastTokenOverrides : {};
  // forced-colors goes last — accessibility mandate overrides everything.
  const forcedColorsLayer = runtimeOptions.forcedColors ? forcedColorsTokenOverrides : {};

  const tokens = {
    ...baseTokenBundle,
    ...densityTokenScales[density],
    ...motionTokenScales[motion],
    ...contrastLayer,
    ...resolveThemeTokens(theme, effectiveScheme, resolvedVariant),
    ...recipe.tokens,
    ...flattenComponentTokens(recipe.components ?? {}),
    ...config.overrides?.tokens,
    ...flattenComponentTokens(config.overrides?.components ?? {}),
    ...forcedColorsLayer,
  };
  const components = resolveComponentTokens(tokens);

  return {
    requestedMode,
    effectiveScheme,
    effectiveModeSource,
    themeId: theme.id,
    variant: resolvedVariant,
    recipeId: recipe.id,
    density,
    motion,
    tokens,
    tokenOverrides,
    components,
    warnings,
  };
};
