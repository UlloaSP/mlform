// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { componentKeys } from "../contract";
import {
  baseTokenBundle,
  densityTokenScales,
  flattenComponentTokens,
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
): Record<string, string> => {
  const schemeTokens =
    effectiveScheme === "dark"
      ? (theme.schemes.dark?.tokens ?? theme.schemes.light.tokens)
      : theme.schemes.light.tokens;

  return {
    ...theme.sharedTokens,
    ...schemeTokens,
  };
};

const resolveComponentTokens = (
  tokens: Record<string, string>,
): Record<(typeof componentKeys)[number], ResolvedComponentConfig> => {
  return Object.fromEntries(
    componentKeys.map((key) => [
      key,
      {
        tokens: Object.fromEntries(
          Object.entries(tokens).filter(([token]) => token.startsWith(`--mlf-${key}-`)),
        ),
      },
    ]),
  ) as Record<(typeof componentKeys)[number], ResolvedComponentConfig>;
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
  const density = config.overrides?.density ?? recipe.density;
  // Respect prefers-reduced-motion unless the consumer explicitly overrides motion.
  const motion =
    config.overrides?.motion ?? (runtimeOptions.prefersReducedMotion ? "none" : recipe.motion);

  const tokenOverrides = {
    ...config.overrides?.tokens,
    ...flattenComponentTokens(config.overrides?.components ?? {}),
  };

  const tokens = {
    ...baseTokenBundle,
    ...densityTokenScales[density],
    ...motionTokenScales[motion],
    ...resolveThemeTokens(theme, effectiveScheme),
    ...recipe.tokens,
    ...flattenComponentTokens(recipe.components ?? {}),
    ...config.overrides?.tokens,
    ...flattenComponentTokens(config.overrides?.components ?? {}),
  };
  const components = resolveComponentTokens(tokens);

  return {
    requestedMode,
    effectiveScheme,
    effectiveModeSource,
    themeId: theme.id,
    recipeId: recipe.id,
    density,
    motion,
    tokens,
    tokenOverrides,
    components,
    warnings,
  };
};
