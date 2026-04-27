// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { componentKeys, type ComponentKey, mlfTokenKeys } from "../contract";
import type { ComponentTokenMap, GlobalTokenMap } from "../types";

const knownTokenKeys = new Set<string>(mlfTokenKeys);

const findTokenOwner = (token: string): ComponentKey | null => {
  for (const component of componentKeys) {
    if (token.startsWith(`--mlf-${component}-`)) {
      return component;
    }
  }

  return null;
};

export const defineGlobalTokens = <const T extends GlobalTokenMap>(tokens: T): T => {
  for (const token of Object.keys(tokens)) {
    if (!knownTokenKeys.has(token)) {
      throw new Error(`[mlform] Unknown global token "${token}"`);
    }

    const owner = findTokenOwner(token);
    if (owner) {
      throw new Error(
        `[mlform] Token "${token}" belongs to component "${owner}". Use defineComponentTokens("${owner}", ...)`,
      );
    }
  }

  return { ...tokens };
};

export const defineComponentTokens = <K extends ComponentKey, const T extends ComponentTokenMap<K>>(
  component: K,
  tokens: T,
): { tokens: T } => {
  for (const token of Object.keys(tokens)) {
    if (!knownTokenKeys.has(token)) {
      throw new Error(`[mlform] Unknown token "${token}" for component "${component}"`);
    }

    if (!token.startsWith(`--mlf-${component}-`)) {
      throw new Error(`[mlform] Token "${token}" does not belong to component "${component}"`);
    }
  }

  return { tokens: { ...tokens } };
};
