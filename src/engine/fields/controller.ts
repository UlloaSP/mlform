// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { defaultEquality } from "../equality";
import { EngineError } from "../errors";
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
  areFieldValuesEqual,
  computeSyncErrors,
  createFieldValidator,
  makeFieldState,
  normalizeValue,
  resolveDerivedFlags,
  toSnapshotState,
} from "../validation";

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

const setFieldState = (
  store: EngineStore,
  fieldId: string,
  nextState: InternalFieldState,
): void => {
  store.update((current) => ({
    ...current,
    fieldStates: {
      ...current.fieldStates,
      [fieldId]: nextState,
    },
  }));
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
  const initialValue =
    config.defaultValue !== undefined ? config.defaultValue : definition.getDefaultValue?.(config);

  const initialState = makeFieldState(
    definition,
    config,
    initialValue,
    getValues(),
    getSubmitCount(),
    getFormStatus(),
  );
  setFieldState(store, config.id, initialState);

  const getInternalState = (): InternalFieldState => store.getState().fieldStates[config.id];

  const fieldValidator = createFieldValidator({
    config,
    definition,
    store,
    getValues,
    getSubmitCount,
    getFormStatus,
    commitState: (fieldId, nextState) => setFieldState(store, fieldId, nextState),
  });

  const controller: InternalFieldController = {
    get id() {
      return config.id;
    },
    get kind() {
      return config.kind;
    },
    get config() {
      return config;
    },
    get state() {
      return toFieldStateSnapshot(getInternalState());
    },
    get descriptor() {
      return definition.describe(config, {
        fieldId: config.id,
        state: this.state,
      });
    },
    setValue(value) {
      const nextValues = {
        ...getValues(),
        [config.id]: this.coerceValue(value),
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
      const currentState = getInternalState();
      const normalizedValue = normalizeValue(definition, config, value);
      const flags = resolveDerivedFlags(config, values, getSubmitCount(), getFormStatus());

      if (!flags.visible) {
        throw new EngineError(`Field "${config.id}" is hidden and cannot be updated.`);
      }
      if (flags.disabled) {
        throw new EngineError(`Field "${config.id}" is disabled and cannot be updated.`);
      }
      if (flags.readOnly) {
        throw new EngineError(`Field "${config.id}" is read-only and cannot be updated.`);
      }

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
    },
    commitState(state) {
      setFieldState(store, config.id, state);
    },
    blur() {
      const currentState = getInternalState();
      setFieldState(store, config.id, {
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
      setFieldState(store, config.id, {
        ...initialState,
      });
    },
    subscribe(listener) {
      let previousState = getInternalState();
      return store.subscribe(() => {
        const nextState = store.getState().fieldStates[config.id];
        if (!defaultEquality(previousState, nextState)) {
          previousState = nextState;
          listener(toFieldStateSnapshot(nextState));
        }
      });
    },
    serialize() {
      const value = getInternalState().value;
      if (definition.serializeValue) {
        return definition.serializeValue(value, config);
      }
      return value;
    },
    coerceValue(value) {
      return normalizeValue(definition, config, value);
    },
    setExternalErrors(errors) {
      const currentState = getInternalState();
      setFieldState(
        store,
        config.id,
        toSnapshotState({
          ...currentState,
          externalErrors: [...errors],
        }),
      );
    },
    refresh(options) {
      const currentState = getInternalState();
      const values = options?.values ?? getValues();
      const flags = resolveDerivedFlags(config, values, getSubmitCount(), getFormStatus());
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

      const nextValidationErrors =
        options?.preserveValidationErrors && flags.visible && !flags.disabled
          ? [...currentState.validationErrors]
          : [];
      const nextExternalErrors =
        options?.preserveExternalErrors && flags.visible && !flags.disabled
          ? [...currentState.externalErrors]
          : [];

      const nextState = toSnapshotState({
        ...currentState,
        value: normalizedValue,
        dirty: !areFieldValuesEqual(definition, config, normalizedValue, currentState.initialValue),
        visible: flags.visible,
        disabled: flags.disabled,
        readOnly: flags.readOnly,
        syncErrors,
        validationErrors: nextValidationErrors,
        externalErrors: nextExternalErrors,
        validationVersion: currentState.validationVersion,
      });

      setFieldState(store, config.id, nextState);
      return nextState;
    },
  };

  return controller;
};
