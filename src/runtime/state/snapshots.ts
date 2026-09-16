// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FieldStateSnapshot, FormState } from "../types";
import { cloneValue } from "../values";
import type { EngineState, InternalFieldState } from "./engine";

export const toFieldStateSnapshot = (state: InternalFieldState): FieldStateSnapshot => ({
  value: cloneValue(state.value),
  initialValue: cloneValue(state.initialValue),
  touched: state.touched,
  dirty: state.dirty,
  valid: state.valid,
  visible: state.visible,
  disabled: state.disabled,
  readOnly: state.readOnly,
  errors: [...state.errors],
  status: state.status,
});

export const toFieldStateSnapshots = (
  fieldStates: Record<string, InternalFieldState>,
): Record<string, FieldStateSnapshot> => {
  return Object.fromEntries(
    Object.entries(fieldStates).map(([fieldId, fieldState]) => [
      fieldId,
      toFieldStateSnapshot(fieldState),
    ]),
  );
};

export const toFormState = (state: EngineState): FormState => {
  const values = Object.fromEntries(
    Object.entries(state.fieldStates).map(([fieldId, fieldState]) => [
      fieldId,
      cloneValue(fieldState.value),
    ]),
  );

  const snapshots = toFieldStateSnapshots(state.fieldStates);
  const fieldErrors = Object.fromEntries(
    Object.entries(snapshots).map(([fieldId, fieldState]) => [fieldId, fieldState.errors]),
  );

  const valid =
    state.formErrors.length === 0 &&
    Object.values(snapshots).every((fieldState) => fieldState.valid);
  const dirty = Object.values(snapshots).some((fieldState) => fieldState.dirty);
  const touched = Object.values(snapshots).some((fieldState) => fieldState.touched);

  return {
    status: state.status,
    submitCount: state.submitCount,
    valid,
    dirty,
    touched,
    values,
    reportStates: cloneValue(state.reportStates),
    errors: {
      form: [...state.formErrors],
      fields: fieldErrors,
    },
    lastResult: cloneValue(state.lastResult),
  };
};
