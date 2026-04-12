// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ThemeManifest } from "../types";
import { deepFreeze } from "./deep-freeze";

export const defineTheme = (theme: ThemeManifest): ThemeManifest => {
  if (!theme.id?.trim()) {
    throw new Error(`[mlform] ThemeManifest missing or empty "id"`);
  }
  if (!theme.label?.trim()) {
    throw new Error(`[mlform] Theme "${theme.id}" missing or empty "label"`);
  }
  if (!theme.schemes?.light?.tokens) {
    throw new Error(`[mlform] Theme "${theme.id}" missing "schemes.light.tokens"`);
  }

  return deepFreeze({
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
    variants: theme.variants
      ? Object.fromEntries(
          Object.entries(theme.variants).map(([key, variant]) => [
            key,
            {
              baseScheme: variant.baseScheme,
              tokens: { ...variant.tokens },
            },
          ]),
        )
      : undefined,
    sharedTokens: theme.sharedTokens ? { ...theme.sharedTokens } : undefined,
  });
};
