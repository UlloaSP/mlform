// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { defaultEquality } from "../equality";
import { EngineError } from "../errors";
import {
  toFieldStateSnapshot,
  transitionEngineState,
  type EngineStore,
  type InternalFieldState,
} from "../state";
import type {
  FieldController,
  FieldDefinition,
  FieldValidationResult,
  FormOperation,
  FormSubmissionStatus,
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
import { resolveMappedTargets, type FieldSubmissionEntry, type MappedToTarget } from "@/schema";
import {
  prepareRestoredFieldState,
  restoreFieldSnapshotValue,
  serializeFieldSnapshotValue,
  type RestoredFieldOptions,
} from "./snapshot";

type CreateFieldControllerOptions = {
  config: NormalizedFieldConfig;
  definition: FieldDefinition;
  store: EngineStore;
  getValues: () => Record<string, unknown>;
  getSubmitCount: () => number;
  getFormOperation: () => FormOperation;
  getSubmissionStatus: () => FormSubmissionStatus;
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
  abortValidation(reason?: string): void;
  dispose(): void;
  getMappedTargets(backend?: string): readonly MappedToTarget[];
  getSubmissionEntries(backend?: string): readonly FieldSubmissionEntry[] | undefined;
  serializeSnapshotValue(): import("@/schema").JsonValue;
  restoreSnapshotValue(value: import("@/schema").JsonValue): unknown;
  prepareRestoredState(
    value: unknown,
    values: Record<string, unknown>,
    touched: boolean,
    options?: RestoredFieldOptions,
  ): InternalFieldState;
};

export const createFieldController = ({
  config,
  definition,
  store,
  getValues,
  getSubmitCount,
  getFormOperation,
  getSubmissionStatus,
  onValueChange,
}: CreateFieldControllerOptions): InternalFieldController => {
  let disposed = false;
  const assertUsable = (): void => {
    if (disposed) throw new EngineError(`Field "${config.id}" has been disposed.`);
  };
  const assertActive = (): void => {
    assertUsable();
    if (store.getState().lifecycle === "suspended") {
      throw new EngineError(`Field "${config.id}" belongs to a suspended form.`);
    }
  };
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
    getFormOperation(),
    getSubmissionStatus(),
  );
  setFieldState(store, config.id, initialState);

  const getInternalState = (): InternalFieldState => store.getState().fieldStates[config.id];
  const fieldValidator = createFieldValidator({
    config: readonlyConfig,
    definition,
    store,
    getValues,
    getSubmitCount,
    getFormOperation,
    getSubmissionStatus,
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
      assertActive();
      const nextValues = {
        ...getValues(),
        [readonlyConfig.id]: this.coerceValue(value),
      };

      this.applyValue(value, nextValues);

      if (onValueChange) {
        onValueChange(config.id, nextValues);
        return;
      }

      store.update((current) =>
        transitionEngineState(current, {
          type: "editing",
          clearFormErrors: true,
          bumpLifecycle: true,
        }),
      );
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
        getFormOperation,
        getSubmissionStatus,
      });
    },
    commitState(state) {
      setFieldState(store, readonlyConfig.id, state);
    },
    blur() {
      assertActive();
      const currentState = getInternalState();
      setFieldState(store, readonlyConfig.id, {
        ...currentState,
        touched: true,
      });

      store.update((current) => transitionEngineState(current, { type: "editing" }));
    },
    focus() {
      assertActive();
      // Focus is intentionally a no-op in the headless engine.
    },
    async validate(validationVersion?: number) {
      assertActive();
      return fieldValidator.validate(getInternalState(), validationVersion);
    },
    abortValidation(reason) {
      fieldValidator.abort(reason);
    },
    reset() {
      assertActive();
      fieldValidator.abort("field-reset");
      setFieldState(store, readonlyConfig.id, {
        ...initialState,
      });
    },
    subscribe(listener) {
      assertUsable();
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
    serializeSnapshotValue() {
      return serializeFieldSnapshotValue(definition, readonlyConfig, getInternalState().value);
    },
    restoreSnapshotValue(value) {
      return restoreFieldSnapshotValue(definition, readonlyConfig, value);
    },
    prepareRestoredState(value, values, touched, options) {
      return prepareRestoredFieldState({
        config: readonlyConfig,
        definition,
        currentState: getInternalState(),
        value,
        values,
        touched,
        refreshOptions: options,
      });
    },
    coerceValue(value) {
      return normalizeValue(definition, readonlyConfig, value);
    },
    getMappedTargets(backend) {
      return definition.getMappedTargets
        ? definition.getMappedTargets(readonlyConfig, { backend })
        : resolveMappedTargets(readonlyConfig.mappedTo, backend);
    },
    getSubmissionEntries(backend) {
      if (!definition.getSubmissionEntries) return undefined;
      const value = getInternalState().value;
      return definition.getSubmissionEntries(value, this.serialize(), readonlyConfig, { backend });
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
        getFormOperation,
        getSubmissionStatus,
        options,
      });

      setFieldState(store, readonlyConfig.id, nextState);
      return nextState;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      fieldValidator.abort("dispose");
    },
  };

  return controller;
};
