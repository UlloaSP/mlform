// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { neutralTheme } from "../themes";
import type { DesignSystemConfig, DesignSystemRegistry, ThemeManifest } from "../types";

export const resolveTheme = (
  config: DesignSystemConfig,
  registry: DesignSystemRegistry,
): ThemeManifest => {
  const requested = config.theme;
  const fallback = registry.getTheme("neutral") ?? neutralTheme;

  if (requested && typeof requested !== "string") {
    return requested;
  }

  if (typeof requested === "string") {
    return registry.getTheme(requested) ?? fallback;
  }

  return fallback;
};
