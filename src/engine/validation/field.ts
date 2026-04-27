// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { isAbortLikeError } from "../errors";
import type { EngineStore, InternalFieldState } from "../state";
import type {
  FieldDefinition,
  FieldValidationResult,
  FormStatus,
  NormalizedFieldConfig,
} from "../types";
import { delay, isEmptyValue, isPromiseLike } from "../utils";
import { cloneValue, deepValueEquality } from "../values";
import { resolveDerivedFlags, type DerivedFieldFlags } from "./conditions";

export type FieldStateCommitter = (fieldId: string, nextState: InternalFieldState) => void;

export type FieldValidator = {
  abort(reason?: string): void;
  validate(
    currentState: InternalFieldState,
    validationVersion?: number,
  ): Promise<FieldValidationResult>;
};

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

export const toValidatingState = (state: InternalFieldState): InternalFieldState => {
  const errors = combineErrors(state);

  return {
    ...state,
    errors,
    valid: errors.length === 0,
    status: "validating",
  };
};

export const requiredErrors = (config: NormalizedFieldConfig, value: unknown): string[] => {
  if (!config.required) {
    return [];
  }

  return isEmptyValue(value) ? ["This field is required."] : [];
};

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

export const cloneFieldValue = (
  definition: FieldDefinition,
  config: NormalizedFieldConfig,
  value: unknown,
): unknown => {
  if (definition.cloneValue) {
    return definition.cloneValue(value, config);
  }

  return cloneValue(value);
};

export const areFieldValuesEqual = (
  definition: FieldDefinition,
  config: NormalizedFieldConfig,
  previous: unknown,
  next: unknown,
): boolean => {
  if (definition.isEqual) {
    return definition.isEqual(previous, next, config);
  }

  return deepValueEquality(previous, next);
};

export const runSyncValidation = (
  definition: FieldDefinition,
  config: NormalizedFieldConfig,
  value: unknown,
  values: Record<string, unknown>,
  submitCount: number,
): string[] => {
  if (!definition.validate) {
    return [];
  }
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
  if (!flags.visible || flags.disabled) {
    return [];
  }

  const errors = requiredErrors(config, value);
  if (errors.length > 0) {
    return errors;
  }

  return runSyncValidation(definition, config, value, values, submitCount);
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

type CreateFieldValidatorOptions = {
  config: NormalizedFieldConfig;
  definition: FieldDefinition;
  store: EngineStore;
  getValues: () => Record<string, unknown>;
  getSubmitCount: () => number;
  getFormStatus: () => FormStatus;
  commitState: FieldStateCommitter;
};

export const createFieldValidator = ({
  config,
  definition,
  store,
  getValues,
  getSubmitCount,
  getFormStatus,
  commitState,
}: CreateFieldValidatorOptions): FieldValidator => {
  let activeAbortController: AbortController | null = null;
  let activeValidationRunId = 0;

  return {
    abort(reason) {
      activeAbortController?.abort(reason);
      activeAbortController = null;
    },
    async validate(currentState, validationVersion = store.getState().activeValidationVersion) {
      const lifecycleVersion = store.getState().lifecycleVersion;
      const values = getValues();
      const normalizedValue = normalizeValue(definition, config, currentState.value);
      const submitCount = getSubmitCount();
      const flags = resolveDerivedFlags(config, values, submitCount, getFormStatus());
      const validationRunId = ++activeValidationRunId;
      const abortController = typeof AbortController !== "undefined" ? new AbortController() : null;
      const syncErrors = computeSyncErrors(
        definition,
        config,
        normalizedValue,
        values,
        submitCount,
        flags,
      );

      activeAbortController?.abort("validation-restarted");
      activeAbortController = abortController;

      if (!flags.visible || flags.disabled) {
        const nextState = toSnapshotState({
          ...currentState,
          value: normalizedValue,
          visible: flags.visible,
          disabled: flags.disabled,
          readOnly: flags.readOnly,
          syncErrors,
          validationErrors: [],
          externalErrors: [],
        });
        if (activeAbortController === abortController) {
          activeAbortController = null;
        }
        commitState(config.id, nextState);
        return {
          fieldId: config.id,
          valid: true,
          errors: [],
        };
      }

      commitState(
        config.id,
        toValidatingState({
          ...currentState,
          visible: flags.visible,
          disabled: flags.disabled,
          readOnly: flags.readOnly,
          validationVersion,
          syncErrors,
          validationErrors: [...currentState.validationErrors],
          externalErrors: [...currentState.externalErrors],
          status: "validating",
        }),
      );

      let validationErrors: string[] = [];

      if (syncErrors.length === 0 && definition.validate) {
        try {
          const debounceMs =
            typeof config.asyncValidationDebounceMs === "number"
              ? config.asyncValidationDebounceMs
              : 0;

          if (debounceMs > 0) {
            await delay(debounceMs, abortController?.signal);
          }

          const validationResult = definition.validate(normalizedValue, config, {
            field: config,
            values,
            submitCount,
            validationVersion,
            signal: abortController?.signal,
          });

          if (isPromiseLike(validationResult)) {
            validationErrors = await validationResult;
          }
        } catch (error) {
          if (abortController?.signal.aborted || isAbortLikeError(error)) {
            return {
              fieldId: config.id,
              valid: currentState.valid,
              errors: [...currentState.errors],
            };
          }

          throw error;
        }
      }

      const stillCurrent =
        store.getState().activeValidationVersion === validationVersion &&
        store.getState().lifecycleVersion === lifecycleVersion &&
        activeValidationRunId === validationRunId &&
        !abortController?.signal.aborted;

      const nextState = toSnapshotState({
        ...currentState,
        value: normalizedValue,
        touched: true,
        dirty: !areFieldValuesEqual(definition, config, normalizedValue, currentState.initialValue),
        visible: flags.visible,
        disabled: flags.disabled,
        readOnly: flags.readOnly,
        syncErrors,
        validationErrors,
        externalErrors: [...currentState.externalErrors],
        validationVersion,
      });

      if (stillCurrent) {
        commitState(config.id, nextState);
      }

      if (activeAbortController === abortController) {
        activeAbortController = null;
      }

      return {
        fieldId: config.id,
        valid: nextState.valid,
        errors: [...nextState.errors],
      } satisfies FieldValidationResult;
    },
  };
};
