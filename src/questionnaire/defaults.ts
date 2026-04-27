// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import {
  builtinDesignSystemRegistry,
  mergeDesignSystemConfig,
  type DesignSystemConfig,
  type DesignSystemRegistry,
} from "@/design-system";
import { createBuiltinRegistry, createRegistry, type Registry } from "@/engine";
import { createBuiltinPrimitiveRegistry, type PrimitiveRegistry } from "@/primitives";

export const defaultQuestionnaireDesignSystem: DesignSystemConfig = {
  mode: "auto",
  theme: "neutral",
  recipe: "default",
};

export const cloneQuestionnaireEngineRegistry = (registry?: Registry): Registry => {
  if (!registry) {
    return createBuiltinRegistry();
  }

  const next = createRegistry();

  for (const definition of registry.listFields()) {
    next.registerField(definition);
  }

  for (const definition of registry.listReports()) {
    next.registerReport(definition);
  }

  for (const definition of registry.listExplanations()) {
    next.registerExplanation(definition);
  }

  return next;
};

export const resolveQuestionnairePrimitiveRegistry = (
  registry?: PrimitiveRegistry,
): PrimitiveRegistry => {
  return registry?.clone() ?? createBuiltinPrimitiveRegistry();
};

export const resolveQuestionnaireDesignSystemRegistry = (
  registry?: DesignSystemRegistry,
): DesignSystemRegistry => {
  return registry?.clone() ?? builtinDesignSystemRegistry.clone();
};

export const resolveQuestionnaireDesignSystem = (
  config?: DesignSystemConfig,
): DesignSystemConfig => {
  return mergeDesignSystemConfig(defaultQuestionnaireDesignSystem, config ?? {});
};
