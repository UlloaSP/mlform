// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { InternalFieldState } from "../state";
import type { FieldDefinition, FormStatus, NormalizedFieldConfig } from "../types";
import { isEmptyValue, isPromiseLike } from "../utils";
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

export const requiredErrors = (config: NormalizedFieldConfig, value: unknown): string[] => {
  if (!config.required) return [];
  return isEmptyValue(value) ? ["This field is required."] : [];
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
    return cloneFieldValue(definition, config, definition.normalizeValue(value, config));
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
): string[] => {
  if (!definition.validate) return [];
  if (
    typeof config.asyncValidationDebounceMs === "number" &&
    config.asyncValidationDebounceMs > 0
  ) {
    return [];
  }

  const result = definition.validate(value, config, {
    field: config,
    values,
    submitCount,
    validationVersion: 0,
    signal: undefined,
  });
  return isPromiseLike(result) ? [] : result;
};

export const computeSyncErrors = (
  definition: FieldDefinition,
  config: NormalizedFieldConfig,
  value: unknown,
  values: Record<string, unknown>,
  submitCount: number,
  flags: DerivedFieldFlags,
): string[] => {
  if (!flags.visible || flags.disabled) return [];
  const errors = requiredErrors(config, value);
  return errors.length > 0
    ? errors
    : runSyncValidation(definition, config, value, values, submitCount);
};

export const makeFieldState = (
  definition: FieldDefinition,
  config: NormalizedFieldConfig,
  initialValue: unknown,
  values: Record<string, unknown>,
  submitCount: number,
  formStatus: FormStatus,
): InternalFieldState => {
  const normalizedValue = normalizeValue(definition, config, initialValue);
  const flags = resolveDerivedFlags(config, values, submitCount, formStatus);
  const syncErrors = computeSyncErrors(
    definition,
    config,
    normalizedValue,
    values,
    submitCount,
    flags,
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
