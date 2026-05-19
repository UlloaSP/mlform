// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { createMappedCategoryBehavior } from "@/behaviors";
import { createPresentationRegistry } from "@/presentation";
import {
  booleanFieldDefinition,
  categoryFieldDefinition,
  dateFieldDefinition,
  longTextFieldDefinition,
  mappedCategoryFieldDefinition,
  multiChoiceFieldDefinition,
  numberFieldDefinition,
  ratingFieldDefinition,
  seriesFieldDefinition,
  singleChoiceFieldDefinition,
  textFieldDefinition,
} from "@/builtins-ml";
import { createRegistry } from "@/schema";
import { type RegistryPack, registerFieldPresenterFromDefinition } from "./shared";

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

export const createDefaultRegistryPack = (): RegistryPack => {
  const registry = createRegistry();
  const presentationRegistry = createPresentationRegistry();

  for (const definition of fieldDefinitions) {
    registry.registerField(definition as never);
    registerFieldPresenterFromDefinition(presentationRegistry, definition);
  }

  return {
    registry,
    presentationRegistry,
    behaviors: [createMappedCategoryBehavior()],
  };
};
