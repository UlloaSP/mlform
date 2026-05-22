// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { componentKeys, componentTokenDefaults, globalTokenDefaults } from "../contract";

export const flattenComponentTokens = (
  components: Partial<Record<(typeof componentKeys)[number], { tokens?: Record<string, string> }>>,
): Record<string, string> => {
  const result: Record<string, string> = {};

  for (const key of componentKeys) {
    const tokens = components[key]?.tokens;
    if (!tokens) {
      continue;
    }

    Object.assign(result, tokens);
  }

  return result;
};

export const baseTokenBundle: Record<string, string> = {
  ...globalTokenDefaults,
  ...flattenComponentTokens(componentTokenDefaults),
};
