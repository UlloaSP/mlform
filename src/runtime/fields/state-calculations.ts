// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { EngineError } from "../errors";
import type { InternalFieldState } from "../state";
import type {
  FieldDefinition,
  FormStatus,
  InactiveFieldPolicy,
  NormalizedFieldConfig,
} from "../types";
import {
  areFieldValuesEqual,
  computeSyncErrors,
  normalizeValue,
  resolveDerivedFlags,
  toSnapshotState,
} from "../validation";

const resolveFlags = (
  config: NormalizedFieldConfig,
  values: Record<string, unknown>,
  getSubmitCount: () => number,
  getFormStatus: () => FormStatus,
) => resolveDerivedFlags(config, values, getSubmitCount(), getFormStatus());

export const prepareFieldState = ({
  config,
  definition,
  value,
  values,
  currentState,
  getSubmitCount,
  getFormStatus,
}: {
  config: NormalizedFieldConfig;
  definition: FieldDefinition;
  value: unknown;
  values: Record<string, unknown>;
  currentState: InternalFieldState;
  getSubmitCount: () => number;
  getFormStatus: () => FormStatus;
}): InternalFieldState => {
  const normalizedValue = normalizeValue(definition, config, value);
  const flags = resolveFlags(config, values, getSubmitCount, getFormStatus);

  if (!flags.visible)
    throw new EngineError(`Field "${config.id}" is hidden and cannot be updated.`);
  if (flags.disabled)
    throw new EngineError(`Field "${config.id}" is disabled and cannot be updated.`);
  if (flags.readOnly)
    throw new EngineError(`Field "${config.id}" is read-only and cannot be updated.`);

  const syncErrors = computeSyncErrors(
    definition,
    config,
    normalizedValue,
    values,
    getSubmitCount(),
    flags,
  );

  return toSnapshotState({
    ...currentState,
    value: normalizedValue,
    touched: true,
    dirty: !areFieldValuesEqual(definition, config, normalizedValue, currentState.initialValue),
    visible: flags.visible,
    disabled: flags.disabled,
    readOnly: flags.readOnly,
    syncErrors,
    validationErrors: [],
    externalErrors: [],
  });
};

export const refreshFieldState = ({
  config,
  definition,
  currentState,
  values,
  getSubmitCount,
  getFormStatus,
  options,
}: {
  config: NormalizedFieldConfig;
  definition: FieldDefinition;
  currentState: InternalFieldState;
  values: Record<string, unknown>;
  getSubmitCount: () => number;
  getFormStatus: () => FormStatus;
  options?: {
    preserveValidationErrors?: boolean;
    preserveExternalErrors?: boolean;
    resetInactiveToInitial?: boolean;
    inactiveFieldPolicy?: InactiveFieldPolicy;
  };
}): InternalFieldState => {
  const flags = resolveFlags(config, values, getSubmitCount, getFormStatus);
  const inactiveFieldPolicy = config.inactiveFieldPolicy ?? options?.inactiveFieldPolicy;
  const shouldResetInactive =
    (options?.resetInactiveToInitial === true || inactiveFieldPolicy === "reset-on-hide") &&
    (!flags.visible || flags.disabled);
  const normalizedValue = normalizeValue(
    definition,
    config,
    shouldResetInactive ? currentState.initialValue : currentState.value,
  );
  const syncErrors = computeSyncErrors(
    definition,
    config,
    normalizedValue,
    values,
    getSubmitCount(),
    flags,
  );

  return toSnapshotState({
    ...currentState,
    value: normalizedValue,
    dirty: !areFieldValuesEqual(definition, config, normalizedValue, currentState.initialValue),
    visible: flags.visible,
    disabled: flags.disabled,
    readOnly: flags.readOnly,
    syncErrors,
    validationErrors:
      options?.preserveValidationErrors && flags.visible && !flags.disabled
        ? [...currentState.validationErrors]
        : [],
    externalErrors:
      options?.preserveExternalErrors && flags.visible && !flags.disabled
        ? [...currentState.externalErrors]
        : [],
    validationVersion: currentState.validationVersion,
  });
};
