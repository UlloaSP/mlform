// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import {
  builtinDesignSystemRegistry,
  type DesignSystemConfig,
  type DesignSystemRegistry,
  mergeDesignSystemConfig,
} from "@/design";
import {
  createBuiltinPrimitiveRegistry,
  primitiveDefaultLabels,
  type PrimitiveRegistry,
} from "@/primitives";
import type { KitLabels } from "./mount-types";

export const defaultKitLabels: Required<KitLabels> = {
  ...primitiveDefaultLabels,
  prev: "Previous",
  next: "Next",
  step: "Step",
  tabs: "Form sections",
  sectionsOpen: (count) => `${count} sections open`,
  stepLabel: (current, total) => `Step ${current} of ${total}`,
};

export const defaultKitDesignSystem: DesignSystemConfig = {
  mode: "auto",
  theme: "neutral",
  recipe: "default",
};

export const resolvePrimitiveRegistry = (registry?: PrimitiveRegistry): PrimitiveRegistry => {
  return registry?.clone() ?? createBuiltinPrimitiveRegistry();
};

export const resolveDesignSystemRegistry = (
  registry?: DesignSystemRegistry,
): DesignSystemRegistry => {
  return registry?.clone() ?? builtinDesignSystemRegistry.clone();
};

export const resolveKitLabels = (labels: KitLabels = {}): Required<KitLabels> => {
  return {
    ...defaultKitLabels,
    ...labels,
  };
};

export const resolveKitDesignSystem = (config: DesignSystemConfig = {}): DesignSystemConfig => {
  return mergeDesignSystemConfig(defaultKitDesignSystem, config);
};
