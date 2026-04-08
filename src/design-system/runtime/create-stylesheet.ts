// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ResolvedDesignSystem } from "../types";

export const createDesignSystemStylesheet = (
  resolved: ResolvedDesignSystem,
  selector = ":host",
): string => {
  const lines = Object.entries(resolved.tokens)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([token, value]) => `  ${token}: ${value};`);

  return `${selector} {\n${lines.join("\n")}\n}`;
};
