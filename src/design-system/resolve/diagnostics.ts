// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { componentKeys, mlfTokenKeys } from "../contract";
import type {
  DesignSystemConfig,
  DesignSystemRegistry,
  DesignSystemWarning,
  RecipeManifest,
  ThemeManifest,
} from "../types";

const knownTokenKeys = new Set<string>(mlfTokenKeys);

const pushUnknownTokenWarnings = (
  warnings: DesignSystemWarning[],
  path: string,
  tokens: Record<string, string> | undefined,
): void => {
  if (!tokens) {
    return;
  }

  for (const token of Object.keys(tokens)) {
    if (!token.startsWith("--mlf-") || knownTokenKeys.has(token)) {
      continue;
    }

    warnings.push({
      code: "unknown-token-key",
      path,
      value: token,
      message: `[mlform] Unknown design-system token "${token}" at ${path}`,
    });
  }
};

const pushMisplacedComponentTokenWarnings = (
  warnings: DesignSystemWarning[],
  component: string,
  path: string,
  tokens: Record<string, string> | undefined,
): void => {
  if (!tokens) {
    return;
  }

  for (const token of Object.keys(tokens)) {
    if (!token.startsWith("--mlf-") || !knownTokenKeys.has(token)) {
      continue;
    }

    if (token.startsWith(`--mlf-${component}-`)) {
      continue;
    }

    warnings.push({
      code: "misplaced-component-token",
      path,
      value: token,
      message: `[mlform] Token "${token}" does not belong to component "${component}" at ${path}`,
    });
  }
};

const dedupeWarnings = (warnings: DesignSystemWarning[]): DesignSystemWarning[] => {
  const seen = new Set<string>();

  return warnings.filter((warning) => {
    const key = [warning.code, warning.path ?? "", warning.value ?? "", warning.message].join("|");
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

export const collectDesignSystemWarnings = (
  config: DesignSystemConfig,
  registry: DesignSystemRegistry,
  theme: ThemeManifest,
  recipe: RecipeManifest,
): DesignSystemWarning[] => {
  const warnings: DesignSystemWarning[] = [];

  if (typeof config.theme === "string" && !registry.getTheme(config.theme)) {
    warnings.push({
      code: "unknown-theme-id",
      path: "theme",
      value: config.theme,
      message: `[mlform] Unknown theme "${config.theme}". Falling back to "${theme.id}"`,
    });
  }

  if (typeof config.recipe === "string" && !registry.getRecipe(config.recipe)) {
    warnings.push({
      code: "unknown-recipe-id",
      path: "recipe",
      value: config.recipe,
      message: `[mlform] Unknown recipe "${config.recipe}". Falling back to "${recipe.id}"`,
    });
  }

  pushUnknownTokenWarnings(warnings, `theme "${theme.id}".sharedTokens`, theme.sharedTokens);
  pushUnknownTokenWarnings(
    warnings,
    `theme "${theme.id}".schemes.light.tokens`,
    theme.schemes.light.tokens,
  );
  pushUnknownTokenWarnings(
    warnings,
    `theme "${theme.id}".schemes.dark.tokens`,
    theme.schemes.dark?.tokens,
  );
  pushUnknownTokenWarnings(warnings, `recipe "${recipe.id}".tokens`, recipe.tokens);

  for (const [componentKey, component] of Object.entries(recipe.components ?? {})) {
    pushUnknownTokenWarnings(
      warnings,
      `recipe "${recipe.id}".components.${componentKey}.tokens`,
      component?.tokens,
    );
    pushMisplacedComponentTokenWarnings(
      warnings,
      componentKey,
      `recipe "${recipe.id}".components.${componentKey}.tokens`,
      component?.tokens,
    );
  }

  pushUnknownTokenWarnings(warnings, "overrides.tokens", config.overrides?.tokens);

  for (const component of componentKeys) {
    const entry = config.overrides?.components?.[component];
    pushUnknownTokenWarnings(warnings, `overrides.components.${component}.tokens`, entry?.tokens);
    pushMisplacedComponentTokenWarnings(
      warnings,
      component,
      `overrides.components.${component}.tokens`,
      entry?.tokens,
    );
  }

  return dedupeWarnings(warnings);
};

export const assertDesignSystemWarnings = (
  config: DesignSystemConfig,
  warnings: DesignSystemWarning[],
): void => {
  if (warnings.length === 0) {
    return;
  }

  for (const warning of warnings) {
    config.onWarning?.(warning);
  }

  if (!config.strict) {
    return;
  }

  throw new Error(warnings.map((warning) => warning.message).join("\n"));
};
