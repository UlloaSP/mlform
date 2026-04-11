// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ResolvedDesignSystem } from "../types";
import { getDesignSystemTokenEntries, validateDesignSystemSelector } from "./declarations";

export const createDesignSystemStylesheet = (
  resolved: ResolvedDesignSystem,
  selector = ":host",
): string => {
  validateDesignSystemSelector(selector);

  const lines = getDesignSystemTokenEntries(resolved).map(
    ([token, value]) => `  ${token}: ${value};`,
  );

  return `${selector} {\n${lines.join("\n")}\n}`;
};
