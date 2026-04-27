// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { componentKeys, mlfTokenKeys } from "../contract";
import type {
  DesignSystemConfig,
  DesignSystemScheme,
  DesignSystemRegistry,
  DesignSystemWarning,
  DesignSystemWarningCode,
  RecipeManifest,
  ThemeManifest,
} from "../types";

const knownTokenKeys = new Set<string>(mlfTokenKeys);

/** Matches `var(--mlf-...)` references in token values. */
const mlfVarReferencePattern = /var\(\s*(--mlf-[a-z0-9-]+)\s*[,)]/g;

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

const pushBrokenReferenceWarnings = (
  warnings: DesignSystemWarning[],
  resolvedTokenKeys: Set<string>,
  tokens: Record<string, string> | undefined,
): void => {
  if (!tokens) {
    return;
  }

  for (const [token, value] of Object.entries(tokens)) {
    mlfVarReferencePattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = mlfVarReferencePattern.exec(value)) !== null) {
      const referencedToken = match[1];
      if (!resolvedTokenKeys.has(referencedToken) && knownTokenKeys.has(referencedToken)) {
        // Only warn about --mlf- tokens that are known to the contract but
        // absent from the resolved set. Non-mlf vars are outside our scope.
        warnings.push({
          code: "broken-token-reference" as DesignSystemWarningCode,
          path: token,
          value: referencedToken,
          message: `[mlform] Token "${token}" references "${referencedToken}" which is not present in the resolved token set`,
        });
      }
    }
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
  for (const [variantId, variant] of Object.entries(theme.variants ?? {})) {
    pushUnknownTokenWarnings(
      warnings,
      `theme "${theme.id}".variants.${variantId}.tokens`,
      variant.tokens,
    );
  }
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

export const collectThemeVariantWarnings = (
  config: DesignSystemConfig,
  theme: ThemeManifest,
  effectiveScheme: DesignSystemScheme,
): DesignSystemWarning[] => {
  if (!config.variant) {
    return [];
  }

  const variant = theme.variants?.[config.variant];
  if (!variant) {
    return [
      {
        code: "invalid-theme-variant",
        path: "variant",
        value: config.variant,
        message: `[mlform] Theme "${theme.id}" does not define variant "${config.variant}"`,
      },
    ];
  }

  if (variant.baseScheme !== effectiveScheme) {
    return [
      {
        code: "invalid-theme-variant",
        path: "variant",
        value: config.variant,
        message: `[mlform] Theme variant "${config.variant}" targets "${variant.baseScheme}" but effective scheme is "${effectiveScheme}". Variant was ignored.`,
      },
    ];
  }

  return [];
};

/**
 * Post-resolution check: validates that `var(--mlf-*)` references in resolved
 * token values point to tokens that actually exist in the resolved set.
 */
export const collectBrokenReferenceWarnings = (
  resolvedTokens: Record<string, string>,
): DesignSystemWarning[] => {
  const warnings: DesignSystemWarning[] = [];
  const resolvedKeys = new Set(Object.keys(resolvedTokens));
  pushBrokenReferenceWarnings(warnings, resolvedKeys, resolvedTokens);
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
