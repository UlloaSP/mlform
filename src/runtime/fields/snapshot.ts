// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { JsonValue } from "@/schema";
import { cloneJsonValue } from "../snapshots/json-value";
import type { InternalFieldState } from "../state";
import type { FieldDefinition, InactiveFieldPolicy, NormalizedFieldConfig } from "../types";
import { normalizeValue } from "../validation";
import { refreshFieldState } from "./state-calculations";

export type RestoredFieldOptions = {
  resetInactiveToInitial?: boolean;
  inactiveFieldPolicy?: InactiveFieldPolicy;
};

export const serializeFieldSnapshotValue = (
  definition: FieldDefinition,
  config: NormalizedFieldConfig,
  value: unknown,
): JsonValue => {
  const serialized = definition.serializeSnapshotValue
    ? definition.serializeSnapshotValue(value, config)
    : value;
  return cloneJsonValue(serialized, `fields.${config.id}.value`);
};

export const restoreFieldSnapshotValue = (
  definition: FieldDefinition,
  config: NormalizedFieldConfig,
  value: JsonValue,
): unknown => {
  const restored = definition.restoreSnapshotValue
    ? definition.restoreSnapshotValue(value, config)
    : value;
  return normalizeValue(definition, config, restored);
};

export const prepareRestoredFieldState = (options: {
  config: NormalizedFieldConfig;
  definition: FieldDefinition;
  currentState: InternalFieldState;
  value: unknown;
  values: Record<string, unknown>;
  touched: boolean;
  refreshOptions?: RestoredFieldOptions;
}): InternalFieldState =>
  refreshFieldState({
    config: options.config,
    definition: options.definition,
    currentState: {
      ...options.currentState,
      value: options.value,
      touched: options.touched,
      validationErrors: [],
      externalErrors: [],
    },
    values: options.values,
    getSubmitCount: () => 0,
    getFormOperation: () => "idle",
    getSubmissionStatus: () => "idle",
    options: {
      preserveValidationErrors: false,
      preserveExternalErrors: false,
      resetInactiveToInitial: options.refreshOptions?.resetInactiveToInitial,
      inactiveFieldPolicy: options.refreshOptions?.inactiveFieldPolicy,
    },
  });
