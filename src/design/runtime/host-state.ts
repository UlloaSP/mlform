// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { designSystemHostAttributeNames } from "../constants";
import type { ResolvedDesignSystem } from "../types";

const hashString = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

export const createResolvedDesignSystemSignature = (resolved: ResolvedDesignSystem): string => {
  const payload = [
    resolved.effectiveScheme,
    resolved.themeId,
    resolved.variant ?? "",
    resolved.recipeId,
    resolved.density,
    resolved.motion,
    ...Object.entries(resolved.tokens)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([token, value]) => `${token}:${value}`),
  ].join("|");
  return `v1:${hashString(payload)}`;
};

export const getResolvedDesignSystemHostAttributes = (
  resolved: ResolvedDesignSystem,
): Record<string, string> => {
  const attributes: Record<string, string> = {
    [designSystemHostAttributeNames.themeId]: resolved.themeId,
    [designSystemHostAttributeNames.recipeId]: resolved.recipeId,
    [designSystemHostAttributeNames.effectiveScheme]: resolved.effectiveScheme,
    [designSystemHostAttributeNames.inheritedScheme]: resolved.effectiveScheme,
    [designSystemHostAttributeNames.density]: resolved.density,
    [designSystemHostAttributeNames.motion]: resolved.motion,
    [designSystemHostAttributeNames.signature]: createResolvedDesignSystemSignature(resolved),
  };

  if (resolved.variant) {
    attributes[designSystemHostAttributeNames.variantId] = resolved.variant;
  }

  return attributes;
};
