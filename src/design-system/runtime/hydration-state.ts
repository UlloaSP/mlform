// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { designSystemHostAttributeNames } from "../constants";
import type { ResolvedDesignSystem } from "../types";
import {
  createResolvedDesignSystemSignature,
  getResolvedDesignSystemHostAttributes,
} from "./host-state";
import { managedDesignSystemAttributes } from "./apply-tokens";

export const captureOriginalTokenValues = (
  host: HTMLElement,
  originalTokenValues: Map<string, string | null>,
  tokens: Record<string, string>,
): void => {
  for (const token of Object.keys(tokens)) {
    if (originalTokenValues.has(token)) {
      continue;
    }

    const value = host.style.getPropertyValue(token);
    originalTokenValues.set(token, value === "" ? null : value);
  }
};

export const restoreRemovedTokenValues = (
  host: HTMLElement,
  appliedTokens: Set<string>,
  originalTokenValues: Map<string, string | null>,
  tokens: Record<string, string>,
): void => {
  const nextTokens = new Set(Object.keys(tokens));

  for (const token of appliedTokens) {
    if (nextTokens.has(token)) {
      continue;
    }

    const originalValue = originalTokenValues.get(token) ?? null;
    if (originalValue === null) {
      host.style.removeProperty(token);
    } else {
      host.style.setProperty(token, originalValue);
    }
  }
};

export const hostMatchesResolved = (host: HTMLElement, resolved: ResolvedDesignSystem): boolean => {
  const expectedAttributes = getResolvedDesignSystemHostAttributes(resolved);
  for (const attribute of managedDesignSystemAttributes) {
    const expected = expectedAttributes[attribute];
    if (expected === undefined) {
      if (host.hasAttribute(attribute)) {
        return false;
      }
      continue;
    }

    if (host.getAttribute(attribute) !== expected) {
      return false;
    }
  }

  if (
    host.getAttribute(designSystemHostAttributeNames.signature) ===
    expectedAttributes[designSystemHostAttributeNames.signature]
  ) {
    return true;
  }

  if (host.style.colorScheme !== resolved.effectiveScheme) {
    return false;
  }

  const inlineTokens = new Map<string, string>();
  for (let index = 0; index < host.style.length; index += 1) {
    const property = host.style.item(index);
    if (!property.startsWith("--mlf-")) {
      continue;
    }
    inlineTokens.set(property, host.style.getPropertyValue(property).trim());
  }

  const resolvedEntries = Object.entries(resolved.tokens);
  if (inlineTokens.size === resolvedEntries.length) {
    for (const [token, value] of resolvedEntries) {
      if (inlineTokens.get(token) !== value) {
        return false;
      }
    }
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  const computed = window.getComputedStyle(host);
  for (const [token, value] of resolvedEntries) {
    if (computed.getPropertyValue(token).trim() !== value) {
      return false;
    }
  }

  return true;
};

export const seedHydratedResolvedState = (
  host: HTMLElement,
  originalTokenValues: Map<string, string | null>,
  config: { resolved: ResolvedDesignSystem; envSnapshot: string },
): {
  appliedTokens: Set<string>;
  resolved: ResolvedDesignSystem;
  signature: string;
  envSnapshot: string;
} | null => {
  if (!hostMatchesResolved(host, config.resolved)) {
    return null;
  }

  captureOriginalTokenValues(host, originalTokenValues, config.resolved.tokens);
  return {
    appliedTokens: new Set(Object.keys(config.resolved.tokens)),
    resolved: config.resolved,
    signature: createResolvedDesignSystemSignature(config.resolved),
    envSnapshot: config.envSnapshot,
  };
};
