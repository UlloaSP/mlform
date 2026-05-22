// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { createPresentationRegistry } from "@/presentation";
import { createRegistry, type FieldConfig, type Registry, type ReportConfig } from "@/schema";
import type { FieldPresenter, PresentationRegistry, ReportPresenter } from "@/presentation";
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
  presentationRegistry: PresentationRegistry;
  behaviors: RuntimeBehavior[];
};

const registerFieldPresenterFromDefinition = (
  presentationRegistry: PresentationRegistry,
  definition: DescriptorCapableFieldDefinition,
): void => {
  if (!definition.describe || presentationRegistry.getField(definition.kind)) {
    return;
  }

  presentationRegistry.registerField({
    kind: definition.kind,
    describe: definition.describe,
  });
};

const registerReportPresenterFromDefinition = (
  presentationRegistry: PresentationRegistry,
  definition: DescriptorCapableReportDefinition,
): void => {
  if (!definition.describe || presentationRegistry.getReport(definition.kind)) {
    return;
  }

  presentationRegistry.registerReport({
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
  const presentationRegistry = createPresentationRegistry();

  for (const definition of fieldDefinitions) {
    registry.registerField(definition as never);
    registerFieldPresenterFromDefinition(presentationRegistry, definition as never);
  }

  for (const definition of reportDefinitions) {
    registry.registerReport(definition as never);
    registerReportPresenterFromDefinition(presentationRegistry, definition as never);
  }

  return {
    registry,
    presentationRegistry,
    behaviors: [createMappedCategoryBehavior()],
  };
};
