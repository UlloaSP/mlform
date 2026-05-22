// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { createPrimitiveDescriptorRegistry } from "@/primitives";
import { createRegistry, type FieldConfig, type Registry, type ReportConfig } from "@/schema";
import type { FieldPresenter, PrimitiveDescriptorRegistry, ReportPresenter } from "@/primitives";
import type { RuntimeBehavior } from "@/runtime";
import {
  booleanFieldDefinition,
  categoryFieldDefinition,
  classifierReportDefinition,
  dateFieldDefinition,
  longTextFieldDefinition,
  mappedCategoryFieldDefinition,
  multiChoiceFieldDefinition,
  numberFieldDefinition,
  ratingFieldDefinition,
  regressorReportDefinition,
  seriesFieldDefinition,
  singleChoiceFieldDefinition,
  textFieldDefinition,
} from "./definitions";
import { createMappedCategoryBehavior } from "./mapped-category-behavior";

const fieldDefinitions = [
  textFieldDefinition,
  numberFieldDefinition,
  booleanFieldDefinition,
  categoryFieldDefinition,
  mappedCategoryFieldDefinition,
  dateFieldDefinition,
  seriesFieldDefinition,
  longTextFieldDefinition,
  singleChoiceFieldDefinition,
  multiChoiceFieldDefinition,
  ratingFieldDefinition,
] as const;

const reportDefinitions = [classifierReportDefinition, regressorReportDefinition] as const;

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
  return createRegistry()
    .registerReport(classifierReportDefinition)
    .registerReport(regressorReportDefinition);
};

export const createMlRegistryPack = (): MlRegistryPack => {
  const registry = createRegistry();
  const descriptorRegistry = createPrimitiveDescriptorRegistry();

  for (const definition of fieldDefinitions) {
    registry.registerField(definition as never);
    registerFieldPresenterFromDefinition(descriptorRegistry, definition as never);
  }

  for (const definition of reportDefinitions) {
    registry.registerReport(definition as never);
    registerReportPresenterFromDefinition(descriptorRegistry, definition as never);
  }

  return {
    registry,
    descriptorRegistry,
    behaviors: [createMappedCategoryBehavior()],
  };
};
