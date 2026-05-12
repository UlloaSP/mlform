// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { designSystemMediaQueries } from "../constants";
import type { DesignSystemMediaSnapshot } from "./fingerprint";

export type MediaQueryListWithLegacy = MediaQueryList & {
  addListener?: (callback: (event: MediaQueryListEvent) => void) => void;
  removeListener?: (callback: (event: MediaQueryListEvent) => void) => void;
};

export const createMediaQueries = (): {
  scheme: MediaQueryListWithLegacy | null;
  motion: MediaQueryListWithLegacy | null;
  contrast: MediaQueryListWithLegacy | null;
  forcedColors: MediaQueryListWithLegacy | null;
} => {
  const hasMQ = typeof window !== "undefined" && typeof window.matchMedia === "function";
  if (!hasMQ) {
    return {
      scheme: null,
      motion: null,
      contrast: null,
      forcedColors: null,
    };
  }

  return {
    scheme: window.matchMedia(
      designSystemMediaQueries.prefersDarkScheme,
    ) as MediaQueryListWithLegacy,
    motion: window.matchMedia(
      designSystemMediaQueries.prefersReducedMotion,
    ) as MediaQueryListWithLegacy,
    contrast: window.matchMedia(
      designSystemMediaQueries.prefersMoreContrast,
    ) as MediaQueryListWithLegacy,
    forcedColors: window.matchMedia(
      designSystemMediaQueries.forcedColors,
    ) as MediaQueryListWithLegacy,
  };
};

export const addMediaListener = (mql: MediaQueryListWithLegacy, fn: () => void): void => {
  if (typeof mql.addEventListener === "function") {
    mql.addEventListener("change", fn);
  } else {
    mql.addListener?.(fn);
  }
};

export const removeMediaListener = (mql: MediaQueryListWithLegacy, fn: () => void): void => {
  if (typeof mql.removeEventListener === "function") {
    mql.removeEventListener("change", fn);
  } else {
    mql.removeListener?.(fn);
  }
};

export const getMediaSnapshot = (queries: {
  scheme: MediaQueryListWithLegacy | null;
  motion: MediaQueryListWithLegacy | null;
  contrast: MediaQueryListWithLegacy | null;
  forcedColors: MediaQueryListWithLegacy | null;
}): DesignSystemMediaSnapshot => {
  return {
    prefersDarkScheme: queries.scheme?.matches ?? false,
    prefersReducedMotion: queries.motion?.matches ?? false,
    prefersMoreContrast: queries.contrast?.matches ?? false,
    forcedColors: queries.forcedColors?.matches ?? false,
  };
};
