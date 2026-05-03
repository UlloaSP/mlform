// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { designSystemHostAttributeNames } from "../constants";
import type { DesignSystemConfig, DesignSystemScheme, EffectiveModeSource } from "../types";

const normalizeScheme = (value: string | null | undefined): DesignSystemScheme | null => {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "light" || normalized === "dark") {
    return normalized;
  }

  return null;
};

export const resolveInheritedScheme = (
  host: HTMLElement,
  config: DesignSystemConfig,
): {
  scheme: DesignSystemScheme | null;
  source: Extract<EffectiveModeSource, "host-attribute" | "host-style" | "host-resolver"> | null;
} => {
  const requestedMode = config.mode ?? "auto";
  if (requestedMode !== "inherit") {
    return { scheme: null, source: null };
  }

  if (config.hostSchemeResolver) {
    const resolvedScheme = config.hostSchemeResolver(host);
    if (resolvedScheme) {
      return { scheme: resolvedScheme, source: "host-resolver" };
    }
  }

  const explicitSelf = normalizeScheme(
    host.getAttribute(designSystemHostAttributeNames.explicitScheme),
  );
  if (explicitSelf) {
    return { scheme: explicitSelf, source: "host-attribute" };
  }

  let current: HTMLElement | null = host.parentElement;
  while (current) {
    const explicit =
      normalizeScheme(current.getAttribute(designSystemHostAttributeNames.inheritedScheme)) ??
      normalizeScheme(current.getAttribute(designSystemHostAttributeNames.effectiveScheme)) ??
      normalizeScheme(current.getAttribute(designSystemHostAttributeNames.explicitScheme));
    if (explicit) {
      return { scheme: explicit, source: "host-attribute" };
    }
    current = current.parentElement;
  }

  if (typeof window === "undefined") {
    return { scheme: null, source: null };
  }

  const computedColorScheme = window.getComputedStyle(host).colorScheme;
  if (computedColorScheme.includes("dark")) {
    return { scheme: "dark", source: "host-style" };
  }
  if (computedColorScheme.includes("light")) {
    return { scheme: "light", source: "host-style" };
  }

  return { scheme: null, source: null };
};
