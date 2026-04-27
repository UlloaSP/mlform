// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { designSystemHostAttributeNames } from "../constants";
import type { DesignSystemTransition, ResolvedDesignSystem } from "../types";
import { writeDesignSystemTokenDeclarations } from "./declarations";
import { getResolvedDesignSystemHostAttributes } from "./host-state";

export const managedDesignSystemAttributes = [
  designSystemHostAttributeNames.themeId,
  designSystemHostAttributeNames.variantId,
  designSystemHostAttributeNames.recipeId,
  designSystemHostAttributeNames.effectiveScheme,
  designSystemHostAttributeNames.inheritedScheme,
  designSystemHostAttributeNames.density,
  designSystemHostAttributeNames.motion,
  designSystemHostAttributeNames.signature,
] as const;

export const applyResolvedDesignSystem = (
  host: HTMLElement,
  resolved: ResolvedDesignSystem,
  transition?: DesignSystemTransition,
): Set<string> => {
  const attributes = getResolvedDesignSystemHostAttributes(resolved);
  for (const attribute of managedDesignSystemAttributes) {
    const value = attributes[attribute];
    if (value === undefined) {
      host.removeAttribute(attribute);
    } else {
      host.setAttribute(attribute, value);
    }
  }

  // When view-transition is active, set view-transition-name so CSS
  // ::view-transition-* pseudo-elements can target the design system host.
  if (transition === "view-transition") {
    host.style.viewTransitionName = "mlf-design-system";
  }

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

  host.style.removeProperty("view-transition-name");
};
