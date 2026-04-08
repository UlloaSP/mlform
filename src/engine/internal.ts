// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  FieldStateSnapshot,
  FormState,
  FormStatus,
  ReportStateSnapshot,
  SubmitResult,
} from "./types";
import type { Store } from "./store";

export interface InternalFieldState extends FieldStateSnapshot {
  syncErrors: string[];
  validationErrors: string[];
  externalErrors: string[];
  validationVersion: number;
}

export interface EngineState {
  status: FormStatus;
  submitCount: number;
  lastResult: SubmitResult | null;
  formErrors: string[];
  fieldStates: Record<string, InternalFieldState>;
  reportStates: Record<string, ReportStateSnapshot>;
  lifecycleVersion: number;
  activeValidationVersion: number;
  activeSubmissionVersion: number | null;
}

export type EngineStore = Store<EngineState>;

export const createInitialEngineState = (): EngineState => ({
  status: "idle",
  submitCount: 0,
  lastResult: null,
  formErrors: [],
  fieldStates: {},
  reportStates: {},
  lifecycleVersion: 0,
  activeValidationVersion: 0,
  activeSubmissionVersion: null,
});

export const toFieldStateSnapshot = (state: InternalFieldState): FieldStateSnapshot => ({
  value: state.value,
  initialValue: state.initialValue,
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
    Object.entries(state.fieldStates).map(([fieldId, fieldState]) => [fieldId, fieldState.value]),
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
    errors: {
      form: [...state.formErrors],
      fields: fieldErrors,
    },
    lastResult: state.lastResult,
  };
};
