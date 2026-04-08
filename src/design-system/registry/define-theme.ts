// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ThemeManifest } from "../types";

export const defineTheme = (theme: ThemeManifest): ThemeManifest => {
  return {
    ...theme,
    schemes: {
      light: {
        ...theme.schemes.light,
        tokens: { ...theme.schemes.light.tokens },
      },
      ...(theme.schemes.dark
        ? {
            dark: {
              ...theme.schemes.dark,
              tokens: { ...theme.schemes.dark.tokens },
            },
          }
        : {}),
    },
    sharedTokens: theme.sharedTokens ? { ...theme.sharedTokens } : undefined,
  };
};
