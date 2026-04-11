// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { designSystemHostAttributeNames } from "../constants";
import type { ResolvedDesignSystem } from "../types";
import { writeDesignSystemTokenDeclarations } from "./declarations";

export const managedDesignSystemAttributes = [
  designSystemHostAttributeNames.themeId,
  designSystemHostAttributeNames.recipeId,
  designSystemHostAttributeNames.effectiveScheme,
  designSystemHostAttributeNames.inheritedScheme,
  designSystemHostAttributeNames.density,
  designSystemHostAttributeNames.motion,
] as const;

export const applyResolvedDesignSystem = (
  host: HTMLElement,
  resolved: ResolvedDesignSystem,
): Set<string> => {
  host.setAttribute(designSystemHostAttributeNames.themeId, resolved.themeId);
  host.setAttribute(designSystemHostAttributeNames.recipeId, resolved.recipeId);
  host.setAttribute(designSystemHostAttributeNames.effectiveScheme, resolved.effectiveScheme);
  host.setAttribute(designSystemHostAttributeNames.inheritedScheme, resolved.effectiveScheme);
  host.setAttribute(designSystemHostAttributeNames.density, resolved.density);
  host.setAttribute(designSystemHostAttributeNames.motion, resolved.motion);

  host.style.colorScheme = resolved.effectiveScheme;
  return writeDesignSystemTokenDeclarations(host.style, resolved);
};

export const restoreManagedDesignSystem = (
  host: HTMLElement,
  tokens: Iterable<string>,
  originalAttributes: ReadonlyMap<string, string | null>,
  originalTokenValues: ReadonlyMap<string, string | null>,
  originalColorScheme: string | null,
): void => {
  for (const token of tokens) {
    const originalValue = originalTokenValues.get(token) ?? null;
    if (originalValue === null) {
      host.style.removeProperty(token);
    } else {
      host.style.setProperty(token, originalValue);
    }
  }

  for (const attribute of managedDesignSystemAttributes) {
    const originalValue = originalAttributes.get(attribute) ?? null;
    if (originalValue === null) {
      host.removeAttribute(attribute);
    } else {
      host.setAttribute(attribute, originalValue);
    }
  }

  if (originalColorScheme === null) {
    host.style.removeProperty("color-scheme");
  } else {
    host.style.colorScheme = originalColorScheme;
  }
};
