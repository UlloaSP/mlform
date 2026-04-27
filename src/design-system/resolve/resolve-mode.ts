// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  DesignSystemConfig,
  EffectiveModeSource,
  ResolveDesignSystemRuntimeOptions,
  ThemeManifest,
} from "../types";

// When no scheme can be determined from mode/system/inheritance, fall back to "light".
// ThemeScheme.colorScheme is informational only and does not affect this fallback.
const FALLBACK_SCHEME = "light" as const;

const canResolveScheme = (theme: ThemeManifest, scheme: "light" | "dark"): boolean => {
  return scheme === "light" || Boolean(theme.schemes.dark);
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
        effectiveScheme: FALLBACK_SCHEME,
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
    if (options.systemScheme && canResolveScheme(theme, options.systemScheme)) {
      return {
        requestedMode,
        effectiveScheme: options.systemScheme,
        effectiveModeSource: "system",
      };
    }

    return {
      requestedMode,
      effectiveScheme: FALLBACK_SCHEME,
      effectiveModeSource: "theme-fallback",
    };
  }

  if (options.inheritedScheme && canResolveScheme(theme, options.inheritedScheme)) {
    return {
      requestedMode,
      effectiveScheme: options.inheritedScheme,
      effectiveModeSource: options.inheritedSource ?? "default",
    };
  }

  return {
    requestedMode,
    effectiveScheme: FALLBACK_SCHEME,
    effectiveModeSource: "theme-fallback",
  };
};
