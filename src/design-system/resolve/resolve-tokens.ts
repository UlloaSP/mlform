// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { componentKeys, componentTokenDefaults } from "../contract";
import {
  baseTokenBundle,
  densityTokenScales,
  flattenComponentTokens,
  motionTokenScales,
} from "../tokens";
import type {
  DesignSystemConfig,
  RecipeManifest,
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

export const resolveTokens = (
  config: DesignSystemConfig,
  theme: ThemeManifest,
  recipe: RecipeManifest,
  effectiveScheme: "light" | "dark",
  requestedMode: ResolvedDesignSystem["requestedMode"],
  effectiveModeSource: ResolvedDesignSystem["effectiveModeSource"],
): ResolvedDesignSystem => {
  const density = config.overrides?.density ?? recipe.density;
  const motion = config.overrides?.motion ?? recipe.motion;
  const recipeComponentTokens = Object.fromEntries(
    componentKeys.map((key) => [key, recipe.components?.[key] ?? undefined]),
  ) as Partial<Record<(typeof componentKeys)[number], { tokens: Record<string, string> }>>;
  const overrideComponentTokens = Object.fromEntries(
    componentKeys.map((key) => [key, config.overrides?.components?.[key] ?? undefined]),
  ) as Partial<Record<(typeof componentKeys)[number], { tokens?: Record<string, string> }>>;

  const components = Object.fromEntries(
    componentKeys.map((key) => {
      const tokens = {
        ...componentTokenDefaults[key]?.tokens,
        ...recipe.components?.[key]?.tokens,
        ...config.overrides?.components?.[key]?.tokens,
      };

      return [key, { tokens }] satisfies [string, ResolvedComponentConfig];
    }),
  ) as Record<(typeof componentKeys)[number], ResolvedComponentConfig>;

  const tokenOverrides = {
    ...config.overrides?.tokens,
    ...flattenComponentTokens(overrideComponentTokens),
  };

  const tokens = {
    ...baseTokenBundle,
    ...densityTokenScales[density],
    ...motionTokenScales[motion],
    ...resolveThemeTokens(theme, effectiveScheme),
    ...flattenComponentTokens(componentTokenDefaults),
    ...recipe.tokens,
    ...flattenComponentTokens(recipeComponentTokens),
    ...config.overrides?.tokens,
    ...flattenComponentTokens(overrideComponentTokens),
  };

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
  };
};
