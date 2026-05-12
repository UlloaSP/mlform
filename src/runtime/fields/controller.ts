// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { defaultEquality } from "../equality";
import { toFieldStateSnapshot, type EngineStore, type InternalFieldState } from "../state";
import type {
  FieldController,
  FieldDefinition,
  FieldValidationResult,
  FormStatus,
  InactiveFieldPolicy,
  NormalizedFieldConfig,
} from "../types";
import {
  createFieldValidator,
  makeFieldState,
  normalizeValue,
  toSnapshotState,
} from "../validation";
import { deepFreeze } from "../utils";
import { cloneValue } from "../values";
import { prepareFieldState, refreshFieldState } from "./state-calculations";
import { setFieldState } from "./state";

type CreateFieldControllerOptions = {
  config: NormalizedFieldConfig;
  definition: FieldDefinition;
  store: EngineStore;
  getValues: () => Record<string, unknown>;
  getSubmitCount: () => number;
  getFormStatus: () => FormStatus;
  onValueChange?: (fieldId: string, values: Record<string, unknown>) => void;
};

export type RefreshOptions = {
  values?: Record<string, unknown>;
  preserveValidationErrors?: boolean;
  preserveExternalErrors?: boolean;
  resetInactiveToInitial?: boolean;
  inactiveFieldPolicy?: InactiveFieldPolicy;
};

export type InternalFieldController = FieldController & {
  serialize(): unknown;
  refresh(options?: RefreshOptions): InternalFieldState;
  applyValue(value: unknown, values: Record<string, unknown>): void;
  prepareValue(value: unknown, values: Record<string, unknown>): InternalFieldState;
  commitState(state: InternalFieldState): void;
  setExternalErrors(errors: string[]): void;
  coerceValue(value: unknown): unknown;
  validate(validationVersion?: number): Promise<FieldValidationResult>;
};

export const createFieldController = ({
  config,
  definition,
  store,
  getValues,
  getSubmitCount,
  getFormStatus,
  onValueChange,
}: CreateFieldControllerOptions): InternalFieldController => {
  const readonlyConfig = deepFreeze(cloneValue(config));
  const initialValue =
    readonlyConfig.defaultValue !== undefined
      ? readonlyConfig.defaultValue
      : definition.getDefaultValue?.(readonlyConfig);

  const initialState = makeFieldState(
    definition,
    readonlyConfig,
    initialValue,
    getValues(),
    getSubmitCount(),
    getFormStatus(),
  );
  setFieldState(store, config.id, initialState);

  const getInternalState = (): InternalFieldState => store.getState().fieldStates[config.id];
  const fieldValidator = createFieldValidator({
    config: readonlyConfig,
    definition,
    store,
    getValues,
    getSubmitCount,
    getFormStatus,
    commitState: (fieldId, nextState) => setFieldState(store, fieldId, nextState),
  });

  const controller: InternalFieldController = {
    get id() {
      return readonlyConfig.id;
    },
    get kind() {
      return readonlyConfig.kind;
    },
    get config() {
      return readonlyConfig;
    },
    get state() {
      return toFieldStateSnapshot(getInternalState());
    },
    setValue(value) {
      const nextValues = {
        ...getValues(),
        [readonlyConfig.id]: this.coerceValue(value),
      };

      this.applyValue(value, nextValues);

      if (onValueChange) {
        onValueChange(config.id, nextValues);
        return;
      }

      store.update((current) => ({
        ...current,
        status: "editing",
        formErrors: [],
        lifecycleVersion: current.lifecycleVersion + 1,
      }));
    },
    applyValue(value, values) {
      fieldValidator.abort("value-updated");
      this.commitState(this.prepareValue(value, values));
    },
    prepareValue(value, values) {
      return prepareFieldState({
        config: readonlyConfig,
        definition,
        value,
        values,
        currentState: getInternalState(),
        getSubmitCount,
        getFormStatus,
      });
    },
    commitState(state) {
      setFieldState(store, readonlyConfig.id, state);
    },
    blur() {
      const currentState = getInternalState();
      setFieldState(store, readonlyConfig.id, {
        ...currentState,
        touched: true,
      });

      store.update((current) => ({
        ...current,
        status: "editing",
      }));
    },
    focus() {
      // Focus is intentionally a no-op in the headless engine.
    },
    async validate(validationVersion?: number) {
      return fieldValidator.validate(getInternalState(), validationVersion);
    },
    reset() {
      fieldValidator.abort("field-reset");
      setFieldState(store, readonlyConfig.id, {
        ...initialState,
      });
    },
    subscribe(listener) {
      let previousState = getInternalState();
      return store.subscribe(() => {
        const nextState = store.getState().fieldStates[readonlyConfig.id];
        if (!defaultEquality(previousState, nextState)) {
          previousState = nextState;
          listener(toFieldStateSnapshot(nextState));
        }
      });
    },
    serialize() {
      const value = getInternalState().value;
      if (definition.serializeValue) {
        return definition.serializeValue(value, readonlyConfig);
      }
      return value;
    },
    coerceValue(value) {
      return normalizeValue(definition, readonlyConfig, value);
    },
    setExternalErrors(errors) {
      const currentState = getInternalState();
      setFieldState(
        store,
        readonlyConfig.id,
        toSnapshotState({
          ...currentState,
          externalErrors: [...errors],
        }),
      );
    },
    refresh(options) {
      const nextState = refreshFieldState({
        config: readonlyConfig,
        definition,
        currentState: getInternalState(),
        values: options?.values ?? getValues(),
        getSubmitCount,
        getFormStatus,
        options,
      });

      setFieldState(store, readonlyConfig.id, nextState);
      return nextState;
    },
  };

  return controller;
};
