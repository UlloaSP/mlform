// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import {
  builtinDesignSystemRegistry,
  type DesignSystemConfig,
  type DesignSystemRegistry,
  mergeDesignSystemConfig,
} from "@/design";
import { createRegistry, type Registry } from "@/schema";
import {
  createBuiltinPrimitiveRegistry,
  primitiveDefaultLabels,
  type PrimitiveRegistry,
} from "@/primitives";
import type { KitLabels } from "./types";

export const defaultKitLabels: Required<KitLabels> = {
  ...primitiveDefaultLabels,
};

export const defaultKitDesignSystem: DesignSystemConfig = {
  mode: "auto",
  theme: "neutral",
  recipe: "default",
};

export const cloneSchemaRegistry = (registry: Registry): Registry => {
  const next = createRegistry();

  for (const definition of registry.listFields()) {
    next.registerField(definition);
  }

  for (const definition of registry.listReports()) {
    next.registerReport(definition);
  }

  return next;
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
