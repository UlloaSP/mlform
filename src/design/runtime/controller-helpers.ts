// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { resolveDesignSystem } from "../resolve";
import { designSystemEventNames } from "../constants";
import type { DesignSystemConfig, DesignSystemRegistry, ResolvedDesignSystem } from "../types";
import type { DesignSystemMediaSnapshot } from "./fingerprint";
import { resolveInheritedScheme } from "./inherited-scheme";
import {
  addMediaListener,
  getMediaSnapshot,
  removeMediaListener,
  type MediaQueryListWithLegacy,
} from "./media";

export type MediaListenerPair = {
  query: MediaQueryListWithLegacy | null;
  listener: () => void;
};

export const addControllerMediaListeners = (pairs: readonly MediaListenerPair[]): void => {
  for (const pair of pairs) {
    if (pair.query) {
      addMediaListener(pair.query, pair.listener);
    }
  }
};

export const removeControllerMediaListeners = (pairs: readonly MediaListenerPair[]): void => {
  for (const pair of pairs) {
    if (pair.query) {
      removeMediaListener(pair.query, pair.listener);
    }
  }
};

export const getControllerMediaSnapshot = (
  scheme: MediaQueryListWithLegacy | null,
  motion: MediaQueryListWithLegacy | null,
  contrast: MediaQueryListWithLegacy | null,
  forcedColors: MediaQueryListWithLegacy | null,
): DesignSystemMediaSnapshot => {
  return getMediaSnapshot({ scheme, motion, contrast, forcedColors });
};

export const resolveControllerDesignSystem = (
  host: HTMLElement,
  config: DesignSystemConfig,
  registry: DesignSystemRegistry,
  media: DesignSystemMediaSnapshot,
): ResolvedDesignSystem => {
  const inherited = resolveInheritedScheme(host, config);
  return resolveDesignSystem(config, registry, {
    inheritedScheme: inherited.scheme,
    inheritedSource: inherited.source ?? undefined,
    systemScheme: media.prefersDarkScheme ? "dark" : "light",
    prefersReducedMotion: media.prefersReducedMotion,
    prefersMoreContrast: media.prefersMoreContrast,
    forcedColors: media.forcedColors,
  });
};

export const dispatchDesignSystemChange = (
  host: HTMLElement,
  resolved: ResolvedDesignSystem,
): void => {
  host.dispatchEvent(
    new CustomEvent(designSystemEventNames.change, {
      detail: { designSystem: resolved },
      bubbles: true,
      composed: true,
    }),
  );
};
