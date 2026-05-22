// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ResolvedDesignSystem } from "../types";

export type StyleDeclarationTarget = Pick<CSSStyleDeclaration, "setProperty">;

const hasUnsafeControlCharacters = (value: string): boolean => {
  for (let index = 0; index < value.length; index += 1) {
    if (value.charCodeAt(index) <= 0x1f) {
      return true;
    }
  }

  return false;
};

export const validateDesignSystemSelector = (selector: string): void => {
  if (!selector.trim()) {
    throw new Error("[mlform] createDesignSystemStylesheet requires a non-empty selector");
  }

  if (selector.includes("{") || selector.includes("}") || selector.includes(";")) {
    throw new Error("[mlform] createDesignSystemStylesheet selector contains unsafe characters");
  }

  if (hasUnsafeControlCharacters(selector)) {
    throw new Error("[mlform] createDesignSystemStylesheet selector contains unsafe characters");
  }
};

const validateDeclaration = (token: string, value: string): void => {
  if (!token.startsWith("--")) {
    throw new Error(`[mlform] Invalid design-system token "${token}"`);
  }

  if (value.includes("{") || value.includes("}") || value.includes(";")) {
    throw new Error(`[mlform] Token "${token}" contains unsafe stylesheet characters`);
  }

  if (hasUnsafeControlCharacters(value)) {
    throw new Error(`[mlform] Token "${token}" contains unsafe stylesheet characters`);
  }
};

export const getDesignSystemTokenEntries = (
  resolved: ResolvedDesignSystem,
): Array<[string, string]> => {
  return Object.entries(resolved.tokens)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([token, value]) => {
      validateDeclaration(token, value);
      return [token, value];
    });
};

export const writeDesignSystemTokenDeclarations = (
  target: StyleDeclarationTarget,
  resolved: ResolvedDesignSystem,
): Set<string> => {
  const nextApplied = new Set<string>();

  for (const [token, value] of getDesignSystemTokenEntries(resolved)) {
    target.setProperty(token, value);
    nextApplied.add(token);
  }

  return nextApplied;
};
