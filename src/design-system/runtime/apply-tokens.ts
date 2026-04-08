// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ResolvedDesignSystem } from "../types";

export const managedDesignSystemAttributes = [
  "theme-id",
  "recipe-id",
  "effective-scheme",
  "density",
  "motion",
  "data-mlf-effective-scheme",
  "data-mlf-scheme",
] as const;

export const applyResolvedDesignSystem = (
  host: HTMLElement,
  resolved: ResolvedDesignSystem,
): Set<string> => {
  const nextApplied = new Set<string>();

  host.setAttribute("theme-id", resolved.themeId);
  host.setAttribute("recipe-id", resolved.recipeId);
  host.setAttribute("effective-scheme", resolved.effectiveScheme);
  host.setAttribute("density", resolved.density);
  host.setAttribute("motion", resolved.motion);
  host.setAttribute("data-mlf-effective-scheme", resolved.effectiveScheme);
  host.setAttribute("data-mlf-scheme", resolved.effectiveScheme);

  host.style.colorScheme = resolved.effectiveScheme;

  for (const [token, value] of Object.entries(resolved.tokens)) {
    host.style.setProperty(token, value);
    nextApplied.add(token);
  }

  return nextApplied;
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
