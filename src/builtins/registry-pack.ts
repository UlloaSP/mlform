// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { createPrimitiveDescriptorRegistry } from "@/primitives";
import { createRegistry, type FieldConfig, type Registry, type ReportConfig } from "@/schema";
import type { FieldPresenter, PrimitiveDescriptorRegistry, ReportPresenter } from "@/primitives";
import type { RuntimeBehavior } from "@/runtime";
import { builtinFieldDefinitions, builtinReportDefinitions } from "./definitions";
import { createMappedCategoryBehavior } from "./mapped-category-behavior";

type DescriptorCapableFieldDefinition = {
  kind: string;
  describe?: FieldPresenter<FieldConfig, unknown>["describe"];
};

type DescriptorCapableReportDefinition = {
  kind: string;
  describe?: ReportPresenter<ReportConfig>["describe"];
};

export type MlRegistryPack = {
  registry: Registry;
  descriptorRegistry: PrimitiveDescriptorRegistry;
  behaviors: RuntimeBehavior[];
};

const registerFieldPresenterFromDefinition = (
  descriptorRegistry: PrimitiveDescriptorRegistry,
  definition: DescriptorCapableFieldDefinition,
): void => {
  if (!definition.describe || descriptorRegistry.getField(definition.kind)) {
    return;
  }

  descriptorRegistry.registerField({
    kind: definition.kind,
    describe: definition.describe,
  });
};

const registerReportPresenterFromDefinition = (
  descriptorRegistry: PrimitiveDescriptorRegistry,
  definition: DescriptorCapableReportDefinition,
): void => {
  if (!definition.describe || descriptorRegistry.getReport(definition.kind)) {
    return;
  }

  descriptorRegistry.registerReport({
    kind: definition.kind,
    describe: definition.describe,
  });
};

export const createBuiltinMlRegistry = (): Registry => {
  const registry = createRegistry();
  for (const definition of builtinFieldDefinitions) registry.registerField(definition as never);
  for (const definition of builtinReportDefinitions) registry.registerReport(definition as never);
  return registry;
};

/** @deprecated Application composition belongs to `mlform/kit`; use `createBuiltinMlRegistry` for headless runtime setup. */
export const createMlRegistryPack = (): MlRegistryPack => {
  const registry = createRegistry();
  const descriptorRegistry = createPrimitiveDescriptorRegistry();

  for (const definition of builtinFieldDefinitions) {
    registry.registerField(definition as never);
    registerFieldPresenterFromDefinition(descriptorRegistry, definition as never);
  }

  for (const definition of builtinReportDefinitions) {
    registry.registerReport(definition as never);
    registerReportPresenterFromDefinition(descriptorRegistry, definition as never);
  }

  return {
    registry,
    descriptorRegistry,
    behaviors: [createMappedCategoryBehavior()],
  };
};
