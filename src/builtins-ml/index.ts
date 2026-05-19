// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { createMappedCategoryBehavior } from "@/behaviors";
import { createPresentationRegistry } from "@/presentation";
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
import { createRegistry, type Registry } from "@/schema";

export {
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
};
export * from "./constants";

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

export const createBuiltinMlRegistry = (): Registry => {
  return createRegistry()
    .registerReport(classifierReportDefinition)
    .registerReport(regressorReportDefinition);
};

export const createMlRegistryPack = () => {
  const registry = createRegistry();
  const presentationRegistry = createPresentationRegistry();

  for (const definition of fieldDefinitions) {
    registry.registerField(definition as never);
    if (definition.describe) {
      presentationRegistry.registerField({
        kind: definition.kind,
        describe: definition.describe as never,
      });
    }
  }

  for (const definition of reportDefinitions) {
    registry.registerReport(definition as never);
    if (definition.describe) {
      presentationRegistry.registerReport({
        kind: definition.kind,
        describe: definition.describe as never,
      });
    }
  }

  return {
    registry,
    presentationRegistry,
    behaviors: [createMappedCategoryBehavior()],
  };
};
