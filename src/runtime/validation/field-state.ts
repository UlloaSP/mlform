// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { InternalFieldState } from "../state";
import { EngineError } from "../errors";
import type {
  ValidationMessageResolver,
  FieldDefinition,
  FormOperation,
  FormSubmissionStatus,
  NormalizedFieldConfig,
} from "../types";
import { isEmptyValue } from "../utils";
import { cloneValue, deepValueEquality } from "../values";
import { resolveDerivedFlags, type DerivedFieldFlags } from "./conditions";

export const combineErrors = (
  state: Pick<InternalFieldState, "syncErrors" | "validationErrors" | "externalErrors">,
) => {
  return [...state.syncErrors, ...state.validationErrors, ...state.externalErrors];
};

export const toSnapshotState = (state: InternalFieldState): InternalFieldState => {
  const errors = combineErrors(state);
  return {
    ...state,
    errors,
    valid: errors.length === 0,
    status: errors.length === 0 ? "valid" : "invalid",
  };
};

export const toValidatingState = (state: InternalFieldState): InternalFieldState => ({
  ...state,
  errors: combineErrors(state),
  valid: combineErrors(state).length === 0,
  status: "validating",
});

export const requiredErrors = (
  config: NormalizedFieldConfig,
  value: unknown,
  formatMessage?: ValidationMessageResolver,
): string[] => {
  if (!config.required) return [];
  return isEmptyValue(value)
    ? [formatMessage?.("required", "This field is required.") ?? "This field is required."]
    : [];
};

export const cloneFieldValue = (
  definition: FieldDefinition,
  config: NormalizedFieldConfig,
  value: unknown,
): unknown => (definition.cloneValue ? definition.cloneValue(value, config) : cloneValue(value));

export const normalizeValue = (
  definition: FieldDefinition,
  config: NormalizedFieldConfig,
  value: unknown,
): unknown => {
  if (definition.normalizeValue) {
    const normalized = cloneFieldValue(
      definition,
      config,
      definition.normalizeValue(value, config),
    );
    const repeated = cloneFieldValue(
      definition,
      config,
      definition.normalizeValue(cloneFieldValue(definition, config, normalized), config),
    );
    if (!deepValueEquality(normalized, repeated)) {
      throw new EngineError(`Field "${config.id}" normalizer must be idempotent.`);
    }
    return normalized;
  }
  return cloneFieldValue(definition, config, value);
};

export const areFieldValuesEqual = (
  definition: FieldDefinition,
  config: NormalizedFieldConfig,
  previous: unknown,
  next: unknown,
): boolean =>
  definition.isEqual
    ? definition.isEqual(previous, next, config)
    : deepValueEquality(previous, next);

export const runSyncValidation = (
  definition: FieldDefinition,
  config: NormalizedFieldConfig,
  value: unknown,
  values: Record<string, unknown>,
  submitCount: number,
  formatMessage?: ValidationMessageResolver,
): string[] => {
  if (!definition.validateSync) return [];

  return definition.validateSync(value, config, {
    field: config,
    values,
    submitCount,
    validationVersion: 0,
    formatMessage,
    signal: undefined,
  });
};

export const computeSyncErrors = (
  definition: FieldDefinition,
  config: NormalizedFieldConfig,
  value: unknown,
  values: Record<string, unknown>,
  submitCount: number,
  flags: DerivedFieldFlags,
  formatMessage?: ValidationMessageResolver,
): string[] => {
  if (!flags.visible || flags.disabled) return [];
  const errors = requiredErrors(config, value, formatMessage);
  return errors.length > 0
    ? errors
    : runSyncValidation(definition, config, value, values, submitCount, formatMessage);
};

export const makeFieldState = (
  definition: FieldDefinition,
  config: NormalizedFieldConfig,
  initialValue: unknown,
  values: Record<string, unknown>,
  submitCount: number,
  formOperation: FormOperation,
  submissionStatus: FormSubmissionStatus,
  formatMessage?: ValidationMessageResolver,
): InternalFieldState => {
  const normalizedValue = normalizeValue(definition, config, initialValue);
  const flags = resolveDerivedFlags(config, values, submitCount, formOperation, submissionStatus);
  const syncErrors = computeSyncErrors(
    definition,
    config,
    normalizedValue,
    values,
    submitCount,
    flags,
    formatMessage,
  );
  return toSnapshotState({
    value: normalizedValue,
    initialValue: normalizedValue,
    touched: false,
    dirty: false,
    visible: flags.visible,
    disabled: flags.disabled,
    readOnly: flags.readOnly,
    syncErrors,
    validationErrors: [],
    externalErrors: [],
    validationVersion: 0,
    errors: [],
    valid: syncErrors.length === 0,
    status: syncErrors.length === 0 ? "valid" : "invalid",
  });
};
