// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { EngineError } from "./errors";
import type { EngineStore, InternalFieldState } from "./internal";
import type {
  DeclarativeFieldCondition,
  FieldComparisonCondition,
  FieldCondition,
  FieldConditionContext,
  FieldController,
  FieldDefinition,
  FieldStateSnapshot,
  FieldValidationResult,
  FormStatus,
  NormalizedFieldConfig,
} from "./types";
import { compareComparable, defaultEquality, delay, isEmptyValue, isPromiseLike } from "./utils";

type CreateFieldControllerOptions = {
  config: NormalizedFieldConfig;
  definition: FieldDefinition;
  store: EngineStore;
  getValues: () => Record<string, unknown>;
  getSubmitCount: () => number;
  getFormStatus: () => FormStatus;
  onValueChange?: (fieldId: string, values: Record<string, unknown>) => void;
};

type RefreshOptions = {
  values?: Record<string, unknown>;
  preserveValidationErrors?: boolean;
  preserveExternalErrors?: boolean;
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

const combineErrors = (
  state: Pick<InternalFieldState, "syncErrors" | "validationErrors" | "externalErrors">,
) => {
  return [...state.syncErrors, ...state.validationErrors, ...state.externalErrors];
};

const toSnapshotState = (state: InternalFieldState): InternalFieldState => {
  const errors = combineErrors(state);

  return {
    ...state,
    errors,
    valid: errors.length === 0,
    status: errors.length === 0 ? "valid" : "invalid",
  };
};

const requiredErrors = (config: NormalizedFieldConfig, value: unknown): string[] => {
  if (!config.required) {
    return [];
  }

  return isEmptyValue(value) ? ["This field is required."] : [];
};

const normalizeValue = (
  definition: FieldDefinition,
  config: NormalizedFieldConfig,
  value: unknown,
): unknown => {
  if (definition.normalizeValue) {
    return definition.normalizeValue(value, config);
  }

  return value;
};

const resolveCondition = (
  condition: FieldCondition | undefined,
  context: FieldConditionContext,
  fallback: boolean,
): boolean => {
  if (!condition) {
    return fallback;
  }

  if (typeof condition === "function") {
    return condition(context);
  }

  return evaluateDeclarativeCondition(condition, context);
};

const matchesValueList = (value: unknown, list: unknown[]): boolean => {
  return list.some((candidate) => Object.is(candidate, value));
};

const matchesComparison = (
  left: unknown,
  right: unknown,
  operator: FieldComparisonCondition["operator"],
): boolean => {
  const comparison = compareComparable(left, right);
  if (comparison === null) {
    return false;
  }

  switch (operator) {
    case "eq":
      return comparison === 0;
    case "neq":
      return comparison !== 0;
    case "gt":
      return comparison > 0;
    case "gte":
      return comparison >= 0;
    case "lt":
      return comparison < 0;
    case "lte":
      return comparison <= 0;
    default:
      return fallbackComparisonOperatorExhausted(operator);
  }
};

const fallbackComparisonOperatorExhausted = (_operator: never): never => {
  throw new Error("Unsupported comparison operator.");
};

const evaluateDeclarativeCondition = (
  condition: DeclarativeFieldCondition,
  context: FieldConditionContext,
): boolean => {
  switch (condition.kind) {
    case "field-value": {
      const value = context.values[condition.field];

      if (condition.equals !== undefined && !Object.is(value, condition.equals)) {
        return false;
      }
      if (condition.notEquals !== undefined && Object.is(value, condition.notEquals)) {
        return false;
      }
      if (
        condition.greaterThan !== undefined &&
        !matchesComparison(value, condition.greaterThan, "gt")
      ) {
        return false;
      }
      if (
        condition.greaterThanOrEqual !== undefined &&
        !matchesComparison(value, condition.greaterThanOrEqual, "gte")
      ) {
        return false;
      }
      if (condition.lessThan !== undefined && !matchesComparison(value, condition.lessThan, "lt")) {
        return false;
      }
      if (
        condition.lessThanOrEqual !== undefined &&
        !matchesComparison(value, condition.lessThanOrEqual, "lte")
      ) {
        return false;
      }
      if (condition.in && !matchesValueList(value, condition.in)) {
        return false;
      }
      if (condition.notIn && matchesValueList(value, condition.notIn)) {
        return false;
      }
      if (condition.empty === true && !isEmptyValue(value)) {
        return false;
      }
      if (condition.notEmpty === true && isEmptyValue(value)) {
        return false;
      }
      if (condition.truthy === true && !value) {
        return false;
      }
      if (condition.falsy === true && value) {
        return false;
      }

      return true;
    }
    case "field-comparison":
      return matchesComparison(
        context.values[condition.field],
        context.values[condition.otherField],
        condition.operator,
      );
    case "form-status": {
      const expected = Array.isArray(condition.equals) ? condition.equals : [condition.equals];
      return expected.includes(context.formStatus);
    }
    case "submit-count": {
      if (condition.eq !== undefined && context.submitCount !== condition.eq) {
        return false;
      }
      if (condition.gte !== undefined && context.submitCount < condition.gte) {
        return false;
      }
      if (condition.lte !== undefined && context.submitCount > condition.lte) {
        return false;
      }
      return true;
    }
    case "all":
      return condition.conditions.every((item) => evaluateDeclarativeCondition(item, context));
    case "any":
      return condition.conditions.some((item) => evaluateDeclarativeCondition(item, context));
    case "not":
      return !evaluateDeclarativeCondition(condition.condition, context);
    default:
      return fallbackConditionExhausted(condition);
  }
};

const fallbackConditionExhausted = (_condition: never): never => {
  throw new Error("Unsupported field condition.");
};

const isAbortLikeError = (error: unknown): boolean => {
  return error instanceof Error && error.name === "AbortError";
};

const resolveDerivedFlags = (
  config: NormalizedFieldConfig,
  values: Record<string, unknown>,
  submitCount: number,
  formStatus: FormStatus,
) => {
  const context: FieldConditionContext = {
    field: config,
    values,
    submitCount,
    formStatus,
  };

  const visible = !resolveCondition(config.hiddenWhen, context, Boolean(config.hidden));
  const disabled = resolveCondition(config.disabledWhen, context, Boolean(config.disabled));
  const readOnly = resolveCondition(config.readOnlyWhen, context, Boolean(config.readOnly));

  return {
    visible,
    disabled,
    readOnly,
  };
};

const runSyncDefinitionValidation = (
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

const computeSyncErrors = (
  definition: FieldDefinition,
  config: NormalizedFieldConfig,
  value: unknown,
  values: Record<string, unknown>,
  submitCount: number,
  flags: {
    visible: boolean;
    disabled: boolean;
    readOnly: boolean;
  },
): string[] => {
  if (!flags.visible || flags.disabled) {
    return [];
  }

  const errors = requiredErrors(config, value);
  if (errors.length > 0) {
    return errors;
  }

  return runSyncDefinitionValidation(definition, config, value, values, submitCount);
};

const makeFieldState = (
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

export const createFieldController = ({
  config,
  definition,
  store,
  getValues,
  getSubmitCount,
  getFormStatus,
  onValueChange,
}: CreateFieldControllerOptions): FieldController & {
  serialize(): unknown;
  refresh(options?: RefreshOptions): void;
  applyValue(value: unknown, values: Record<string, unknown>): void;
  prepareValue(value: unknown, values: Record<string, unknown>): InternalFieldState;
  commitState(state: InternalFieldState): void;
  setExternalErrors(errors: string[]): void;
  coerceValue(value: unknown): unknown;
} => {
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
  let activeValidationAbortController: AbortController | null = null;
  let activeValidationRunId = 0;

  const controller: FieldController & {
    serialize(): unknown;
    refresh(options?: RefreshOptions): void;
    applyValue(value: unknown, values: Record<string, unknown>): void;
    prepareValue(value: unknown, values: Record<string, unknown>): InternalFieldState;
    commitState(state: InternalFieldState): void;
    setExternalErrors(errors: string[]): void;
    coerceValue(value: unknown): unknown;
  } = {
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
      return store.getState().fieldStates[config.id];
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
      activeValidationAbortController?.abort("value-updated");
      this.commitState(this.prepareValue(value, values));
    },
    prepareValue(value, values) {
      const currentState = this.state as InternalFieldState;
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
        dirty: normalizedValue !== currentState.initialValue,
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
      const currentState = this.state as InternalFieldState;
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
    async validate(validationVersion = store.getState().activeValidationVersion) {
      const currentState = this.state as InternalFieldState;
      const lifecycleVersion = store.getState().lifecycleVersion;
      const values = getValues();
      const normalizedValue = normalizeValue(definition, config, currentState.value);
      const flags = resolveDerivedFlags(config, values, getSubmitCount(), getFormStatus());
      const validationRunId = ++activeValidationRunId;
      const abortController = typeof AbortController !== "undefined" ? new AbortController() : null;

      activeValidationAbortController?.abort("validation-restarted");
      activeValidationAbortController = abortController;

      if (!flags.visible || flags.disabled) {
        const nextState = toSnapshotState({
          ...currentState,
          value: normalizedValue,
          visible: flags.visible,
          disabled: flags.disabled,
          readOnly: flags.readOnly,
          syncErrors: [],
          validationErrors: [],
          externalErrors: [],
        });
        setFieldState(store, config.id, nextState);
        return {
          fieldId: config.id,
          valid: true,
          errors: [],
        };
      }

      setFieldState(
        store,
        config.id,
        toSnapshotState({
          ...currentState,
          visible: flags.visible,
          disabled: flags.disabled,
          readOnly: flags.readOnly,
          validationVersion,
          syncErrors: computeSyncErrors(
            definition,
            config,
            normalizedValue,
            values,
            getSubmitCount(),
            flags,
          ),
          validationErrors: [...currentState.validationErrors],
          externalErrors: [...currentState.externalErrors],
          status: "validating",
        }),
      );

      const syncErrors = computeSyncErrors(
        definition,
        config,
        normalizedValue,
        values,
        getSubmitCount(),
        flags,
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
            submitCount: getSubmitCount(),
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
        dirty: normalizedValue !== currentState.initialValue,
        visible: flags.visible,
        disabled: flags.disabled,
        readOnly: flags.readOnly,
        syncErrors,
        validationErrors,
        externalErrors: [...currentState.externalErrors],
        validationVersion,
      });

      if (stillCurrent) {
        setFieldState(store, config.id, nextState);
      }

      if (activeValidationAbortController === abortController) {
        activeValidationAbortController = null;
      }

      return {
        fieldId: config.id,
        valid: nextState.valid,
        errors: [...nextState.errors],
      } satisfies FieldValidationResult;
    },
    reset() {
      activeValidationAbortController?.abort("field-reset");
      activeValidationAbortController = null;
      setFieldState(store, config.id, {
        ...initialState,
      });
    },
    subscribe(listener) {
      let previousState = this.state as FieldStateSnapshot;
      return store.subscribe(() => {
        const nextState = store.getState().fieldStates[config.id];
        if (!defaultEquality(previousState, nextState)) {
          previousState = nextState;
          listener(nextState);
        }
      });
    },
    serialize() {
      const value = this.state.value;
      if (definition.serializeValue) {
        return definition.serializeValue(value, config);
      }
      return value;
    },
    coerceValue(value) {
      return normalizeValue(definition, config, value);
    },
    setExternalErrors(errors) {
      const currentState = this.state as InternalFieldState;
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
      const currentState = this.state as InternalFieldState;
      const values = options?.values ?? getValues();
      const flags = resolveDerivedFlags(config, values, getSubmitCount(), getFormStatus());
      const normalizedValue = normalizeValue(definition, config, currentState.value);
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

      setFieldState(
        store,
        config.id,
        toSnapshotState({
          ...currentState,
          value: normalizedValue,
          dirty: normalizedValue !== currentState.initialValue,
          visible: flags.visible,
          disabled: flags.disabled,
          readOnly: flags.readOnly,
          syncErrors,
          validationErrors: nextValidationErrors,
          externalErrors: nextExternalErrors,
          validationVersion: currentState.validationVersion,
        }),
      );
    },
  };

  return controller;
};
