// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export type {
  AttachDesignSystemOptions,
  AttachedDesignSystem,
  ComponentManifest,
  Density,
  DesignSystemConfig,
  DesignSystemControllerOptions,
  DesignSystemMode,
  DesignSystemRegistry,
  DesignSystemScheme,
  EffectiveModeSource,
  Motion,
  RecipeManifest,
  ResolvedComponentConfig,
  ResolvedDesignSystem,
  ResolveDesignSystemRuntimeOptions,
  ThemeManifest,
  ThemeScheme,
} from "./types";
export { componentKeys, componentTokenDefaults, globalTokenDefaults } from "./contract";
export {
  builtinRecipes,
  builtinThemes,
  builtinDesignSystemRegistry,
  createBuiltinDesignSystemRegistry,
  createDesignSystemRegistry,
  defineRecipe,
  defineTheme,
} from "./registry";
export { mergeDesignSystemConfig, resolveDesignSystem } from "./resolve";
export {
  attachDesignSystem,
  applyResolvedDesignSystem,
  createDesignSystemStylesheet,
  DesignSystemController,
} from "./runtime";
