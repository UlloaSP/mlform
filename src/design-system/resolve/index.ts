// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { builtinDesignSystemRegistry } from "../registry";
import type {
  DesignSystemConfig,
  DesignSystemRegistry,
  ResolveDesignSystemRuntimeOptions,
  ResolvedDesignSystem,
} from "../types";
import { mergeDesignSystemConfig } from "./merge-config";
import { resolveMode } from "./resolve-mode";
import { resolveRecipe } from "./resolve-recipe";
import { resolveTheme } from "./resolve-theme";
import { resolveTokens } from "./resolve-tokens";

export const resolveDesignSystem = (
  config: DesignSystemConfig = {},
  registry: DesignSystemRegistry = builtinDesignSystemRegistry,
  runtimeOptions: ResolveDesignSystemRuntimeOptions = {},
): ResolvedDesignSystem => {
  const mergedConfig = mergeDesignSystemConfig(config);
  const theme = resolveTheme(mergedConfig, registry);
  const recipe = resolveRecipe(mergedConfig, registry);
  const mode = resolveMode(mergedConfig, theme, runtimeOptions);

  return resolveTokens(
    mergedConfig,
    theme,
    recipe,
    mode.effectiveScheme,
    mode.requestedMode,
    mode.effectiveModeSource,
  );
};

export { mergeDesignSystemConfig } from "./merge-config";
