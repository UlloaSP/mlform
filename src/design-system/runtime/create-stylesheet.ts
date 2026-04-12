// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ResolvedDesignSystem } from "../types";
import { getDesignSystemTokenEntries, validateDesignSystemSelector } from "./declarations";

export interface CreateDesignSystemStylesheetOptions {
  /** CSS selector for the rule block. Defaults to `":host"`. */
  selector?: string;
  /**
   * When set, wraps the output in a `@layer <name> { ... }` block for
   * cascade layer control.
   */
  layer?: string;
}

const layerSegmentPattern = /^-?[_a-zA-Z][_a-zA-Z0-9-]*$/;

const validateLayerName = (layer: string): void => {
  if (!layer.trim()) {
    throw new Error("[mlform] createDesignSystemStylesheet layer name must be non-empty");
  }

  if (layer.includes("{") || layer.includes("}") || layer.includes(";")) {
    throw new Error("[mlform] createDesignSystemStylesheet layer name contains unsafe characters");
  }

  const segments = layer.split(".");
  if (segments.some((segment) => !layerSegmentPattern.test(segment))) {
    throw new Error(
      "[mlform] createDesignSystemStylesheet layer name is not a valid CSS layer name",
    );
  }
};

export const createDesignSystemStylesheet = (
  resolved: ResolvedDesignSystem,
  selectorOrOptions: string | CreateDesignSystemStylesheetOptions = ":host",
): string => {
  const options =
    typeof selectorOrOptions === "string" ? { selector: selectorOrOptions } : selectorOrOptions;
  const selector = options.selector ?? ":host";
  const layer = options.layer;

  validateDesignSystemSelector(selector);

  if (layer) {
    validateLayerName(layer);
  }

  const lines = getDesignSystemTokenEntries(resolved).map(
    ([token, value]) => `  ${token}: ${value};`,
  );

  const ruleBlock = `${selector} {\n${lines.join("\n")}\n}`;

  if (layer) {
    return `@layer ${layer} {\n${ruleBlock}\n}`;
  }

  return ruleBlock;
};
