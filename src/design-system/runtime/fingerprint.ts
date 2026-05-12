// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { DesignSystemConfig, RecipeManifest, ThemeManifest } from "../types";

const serializeStringMap = (record: Record<string, string> | undefined): string => {
  if (!record) {
    return "";
  }

  return Object.entries(record)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${value}`)
    .join(",");
};

const serializeTheme = (theme: ThemeManifest): string => {
  const variants = Object.entries(theme.variants ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([variantId, variant]) =>
        `${variantId}:${variant.baseScheme}:${serializeStringMap(variant.tokens)}`,
    )
    .join(";");

  return [
    theme.id,
    theme.label,
    theme.schemes.light.colorScheme ?? "",
    serializeStringMap(theme.schemes.light.tokens),
    theme.schemes.dark?.colorScheme ?? "",
    serializeStringMap(theme.schemes.dark?.tokens),
    serializeStringMap(theme.sharedTokens),
    variants,
  ].join("|");
};

const serializeRecipe = (recipe: RecipeManifest): string => {
  const components = Object.entries(recipe.components ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([componentKey, component]) => `${componentKey}:${serializeStringMap(component?.tokens)}`)
    .join(";");

  return [
    recipe.id,
    recipe.label,
    recipe.density,
    recipe.motion,
    serializeStringMap(recipe.tokens),
    components,
  ].join("|");
};

const fingerprintConfig = (config: DesignSystemConfig): string => {
  const themeKey =
    typeof config.theme === "string"
      ? `ref:${config.theme}`
      : config.theme
        ? `inline:${serializeTheme(config.theme)}`
        : "";
  const recipeKey =
    typeof config.recipe === "string"
      ? `ref:${config.recipe}`
      : config.recipe
        ? `inline:${serializeRecipe(config.recipe)}`
        : "";
  const overrides = config.overrides;
  const overrideTokens = serializeStringMap(overrides?.tokens);
  const componentFingerprint = Object.entries(overrides?.components ?? {})
    .sort(([left], [right]) => left.localeCompare(right))
    .filter(([, component]) => Boolean(component?.tokens))
    .map(([key, component]) => `${key}:${serializeStringMap(component!.tokens)}`)
    .join(";");

  return `${config.mode ?? ""}|${themeKey}|${recipeKey}|${config.variant ?? ""}|${config.strict ?? ""}|${overrides?.density ?? ""}|${overrides?.motion ?? ""}|${overrideTokens}|${componentFingerprint}`;
};

export type DesignSystemMediaSnapshot = {
  prefersDarkScheme: boolean;
  prefersReducedMotion: boolean;
  prefersMoreContrast: boolean;
  forcedColors: boolean;
};

export const fingerprintEnvironment = (
  config: DesignSystemConfig,
  media: DesignSystemMediaSnapshot,
): string => {
  return `${media.prefersDarkScheme}|${media.prefersReducedMotion}|${media.prefersMoreContrast}|${media.forcedColors}|${fingerprintConfig(config)}`;
};
