// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { builtinDesignSystemRegistry } from "../registry";
import type {
  DesignSystemConfig,
  DesignSystemRegistry,
  ResolveDesignSystemRuntimeOptions,
  ResolvedDesignSystem,
} from "../types";
import {
  assertDesignSystemWarnings,
  collectBrokenReferenceWarnings,
  collectDesignSystemWarnings,
  collectThemeVariantWarnings,
} from "./diagnostics";
import { resolveMode } from "./resolve-mode";
import { resolveRecipe } from "./resolve-recipe";
import { resolveTheme } from "./resolve-theme";
import { resolveTokens } from "./resolve-tokens";

export const resolveDesignSystem = (
  config: DesignSystemConfig = {},
  registry: DesignSystemRegistry = builtinDesignSystemRegistry,
  runtimeOptions: ResolveDesignSystemRuntimeOptions = {},
): ResolvedDesignSystem => {
  const theme = resolveTheme(config, registry);
  const recipe = resolveRecipe(config, registry);
  const warnings = collectDesignSystemWarnings(config, registry, theme, recipe);
  assertDesignSystemWarnings(config, warnings);
  const mode = resolveMode(config, theme, runtimeOptions);
  const variantWarnings = collectThemeVariantWarnings(config, theme, mode.effectiveScheme);
  if (variantWarnings.length > 0) {
    warnings.push(...variantWarnings);
    assertDesignSystemWarnings(config, variantWarnings);
  }

  const resolved = resolveTokens(
    config,
    theme,
    recipe,
    mode.effectiveScheme,
    mode.requestedMode,
    mode.effectiveModeSource,
    warnings,
    runtimeOptions,
  );

  const brokenRefWarnings = collectBrokenReferenceWarnings(resolved.tokens);
  if (brokenRefWarnings.length > 0) {
    resolved.warnings.push(...brokenRefWarnings);
    assertDesignSystemWarnings(config, brokenRefWarnings);
  }

  return resolved;
};
