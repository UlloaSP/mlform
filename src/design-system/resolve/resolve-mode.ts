// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  DesignSystemConfig,
  EffectiveModeSource,
  ResolveDesignSystemRuntimeOptions,
  ThemeManifest,
} from "../types";

const fallbackScheme = (theme: ThemeManifest): "light" | "dark" => {
  if (theme.schemes.light.colorScheme === "dark" && !theme.schemes.dark) {
    return "dark";
  }

  return "light";
};

export const resolveMode = (
  config: DesignSystemConfig,
  theme: ThemeManifest,
  options: ResolveDesignSystemRuntimeOptions = {},
): {
  requestedMode: NonNullable<DesignSystemConfig["mode"]>;
  effectiveScheme: "light" | "dark";
  effectiveModeSource: EffectiveModeSource;
} => {
  const requestedMode = config.mode ?? "auto";

  if (requestedMode === "light" || requestedMode === "dark") {
    if (requestedMode === "dark" && !theme.schemes.dark) {
      return {
        requestedMode,
        effectiveScheme: fallbackScheme(theme),
        effectiveModeSource: "theme-fallback",
      };
    }

    return {
      requestedMode,
      effectiveScheme: requestedMode,
      effectiveModeSource: "explicit",
    };
  }

  if (requestedMode === "auto") {
    if (options.systemScheme) {
      return {
        requestedMode,
        effectiveScheme: options.systemScheme,
        effectiveModeSource: "system",
      };
    }

    return {
      requestedMode,
      effectiveScheme: fallbackScheme(theme),
      effectiveModeSource: "theme-fallback",
    };
  }

  if (options.inheritedScheme) {
    return {
      requestedMode,
      effectiveScheme: options.inheritedScheme,
      effectiveModeSource: options.inheritedSource ?? "default",
    };
  }

  return {
    requestedMode,
    effectiveScheme: fallbackScheme(theme),
    effectiveModeSource: "theme-fallback",
  };
};
