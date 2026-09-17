// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { Registry } from "@/schema";
import { normalizeSchema } from "@/schema";
import { createFieldController, type InternalFieldController } from "./fields";
import { createReportController, type InternalReportController } from "./reports";
import { createInitialEngineState, createStore, toFormState, transitionEngineState } from "./state";
import { createFormSubmitter } from "./submission";
import { createFormValidator, createValidationResult } from "./validation";
import {
  assertTransport,
  hasInteractiveFieldState,
  missingDefinitionError,
  resolveInactiveFieldPolicy,
} from "./create-runtime-helpers";
import { createRuntimeBehaviors } from "./runtime-behaviors";
import { createRuntimeController } from "./runtime-controller";
import { createRuntimeRefresh } from "./runtime-refresh";
import { createRuntimeValues } from "./runtime-values";
import type { CreateFormConfig, FormController, FormState } from "./types";
import { deepFreeze } from "./utils";
import { createDefinitionBehaviors } from "./definition-behaviors";
import { createAbortError } from "./errors";

const waitForBehaviorChanges = (
  completion: Promise<void>,
  signal: AbortSignal | undefined,
): Promise<void> => {
  if (!signal) return completion;
  if (signal.aborted) return Promise.reject(createAbortError(String(signal.reason ?? "")));

  return new Promise<void>((resolve, reject) => {
    const onAbort = () => reject(createAbortError(String(signal.reason ?? "")));
    signal.addEventListener("abort", onAbort, { once: true });
    void completion.then(resolve, reject).finally(() => {
      signal.removeEventListener("abort", onAbort);
    });
  });
};

export const createForm = (config: CreateFormConfig): FormController => {
  assertTransport(config.transport);
  const normalizedSchema = deepFreeze(normalizeSchema(config.schema, config.registry));
  const store = createStore(createInitialEngineState(), {
    listenerErrorPolicy: config.listenerErrorPolicy ?? "ignore",
    onListenerError: config.onListenerError,
  });

  let cachedSourceState = store.getState();
  let cachedFormState = deepFreeze(toFormState(cachedSourceState));

  const getPublicState = (): FormState => {
    const nextState = store.getState();
    if (nextState !== cachedSourceState) {
      cachedSourceState = nextState;
      cachedFormState = deepFreeze(toFormState(nextState));
    }

    return cachedFormState;
  };

  const getSubmitCount = () => store.getState().submitCount;
  const getFormStatus = () => store.getState().status;
  const shouldResetInactiveFields = () => config.inactiveFieldPolicy === "reset-on-hide";
  const getInternalValues = () =>
    Object.fromEntries(
      Object.entries(store.getState().fieldStates).map(([fieldId, fieldState]) => [
        fieldId,
        fieldState.value,
      ]),
    );

  const fields: InternalFieldController[] = normalizedSchema.fields.map((fieldConfig) => {
    const definition = config.registry.getField(fieldConfig.kind) as
      | import("./types").FieldDefinition
      | undefined;
    if (!definition) {
      throw missingDefinitionError("Field", fieldConfig.kind);
    }

    return createFieldController({
      config: {
        ...fieldConfig,
        defaultValue:
          config.initialValues?.[fieldConfig.id] !== undefined
            ? config.initialValues[fieldConfig.id]
            : fieldConfig.defaultValue,
      },
      definition,
      store,
      getValues: () => getInternalValues(),
      getSubmitCount,
      getFormStatus,
      onValueChange: (fieldId, nextValues) => {
        store.batch(() => {
          store.update((current) =>
            transitionEngineState(current, {
              type: "editing",
              clearFormErrors: true,
              bumpLifecycle: true,
            }),
          );

          syncDerivedFieldState({
            values: nextValues,
            preserveValidationErrors: false,
            preserveExternalErrors: false,
            resetInactiveToInitial: shouldResetInactiveFields(),
            inactiveFieldPolicy: config.inactiveFieldPolicy,
          });
        });

        runBehaviorValueChange({
          fieldId,
          values: nextValues,
        });
      },
    });
  });

  const reports: InternalReportController[] = normalizedSchema.reports.map((reportConfig) => {
    const definition = config.registry.getReport(reportConfig.kind) as
      | import("./types").ReportDefinition
      | undefined;
    if (!definition) {
      throw missingDefinitionError("Report", reportConfig.kind);
    }

    return createReportController({
      config: reportConfig,
      definition,
      store,
      hooks: config.hooks,
      onListenerError: config.onListenerError,
    });
  });

  const behaviors = [
    ...createDefinitionBehaviors(fields, config.registry),
    ...(config.behaviors ?? []),
  ];

  const fieldMap = new Map<string, InternalFieldController>(
    fields.map((field) => [field.id, field]),
  );
  const reportMap = new Map<string, InternalReportController>(
    reports.map((report) => [report.id, report]),
  );

  const getCurrentFieldState = (fieldId: string) => store.getState().fieldStates[fieldId];

  const { syncDerivedFieldState, setRestingStatus } = createRuntimeRefresh({
    store,
    fields,
    shouldResetInactiveFields,
    inactiveFieldPolicy: config.inactiveFieldPolicy,
    hasInteractiveFieldState,
  });

  const { getValues, commitDerivedValue } = createRuntimeValues({
    getFieldMap: () => fieldMap,
    getValues: getInternalValues,
    getCurrentFieldState,
    syncDerivedFieldState,
    shouldResetInactiveFields,
    inactiveFieldPolicy: config.inactiveFieldPolicy,
  });

  const {
    runBehaviorValueChange,
    runBehaviorValueChanges,
    flushBehaviorChanges,
    runBeforeSubmitRecords,
    validateBehaviors,
    abortBehaviorChanges,
  } = createRuntimeBehaviors({
    registry: config.registry as Registry,
    behaviors,
    fields,
    getValues,
    getSubmitCount,
    getFormStatus,
    commitDerivedValue,
    syncDerivedState(values) {
      syncDerivedFieldState({
        values,
        preserveValidationErrors: true,
        preserveExternalErrors: true,
        resetInactiveToInitial: shouldResetInactiveFields(),
        inactiveFieldPolicy: config.inactiveFieldPolicy,
      });
    },
    onListenerError: config.onListenerError,
  });

  const resetReports = (): void => {
    for (const report of reports) {
      report.reset();
    }
  };

  const markReportsLoading = (): void => {
    for (const report of reports) {
      report.markLoading();
    }
  };

  const bumpLifecycleVersion = (): number => {
    store.update((current) => transitionEngineState(current, { type: "bump-lifecycle" }));
    return store.getState().lifecycleVersion;
  };

  const formValidator = createFormValidator({
    store,
    fields,
    normalizedSchema,
    validators: config.validators,
    hooks: config.hooks,
    getValues,
    getSubmitCount,
    getFormStatus,
    syncDerivedFieldState,
    setRestingStatus,
    shouldResetInactiveFields,
    inactiveFieldPolicy: config.inactiveFieldPolicy,
  });
  const validateStableState = (signal?: AbortSignal) => {
    const lifecycleVersion = store.getState().lifecycleVersion;
    const pendingBehaviorChanges = flushBehaviorChanges();
    return pendingBehaviorChanges
      ? waitForBehaviorChanges(pendingBehaviorChanges, signal).then(() =>
          store.getState().lifecycleVersion === lifecycleVersion
            ? formValidator.validate()
            : createValidationResult(store),
        )
      : formValidator.validate();
  };

  const formSubmitter = createFormSubmitter({
    store,
    transport: config.transport,
    hooks: config.hooks,
    hookFailurePolicy: config.hookFailurePolicy,
    normalizedSchema,
    fields,
    reports,
    validate: validateStableState,
    getSubmitCount,
    markReportsLoading,
    resetReports,
    syncDerivedFieldState,
    shouldResetInactiveFields,
    resolveInactiveFieldPolicy: (field) =>
      resolveInactiveFieldPolicy(field, config.inactiveFieldPolicy),
    inactiveFieldPolicy: config.inactiveFieldPolicy,
    beforeSubmitRecords: runBeforeSubmitRecords,
    onListenerError: config.onListenerError,
  });

  const controller = createRuntimeController({
    fields,
    reports,
    fieldMap,
    reportMap,
    store,
    getPublicState,
    getValues,
    getInternalValues,
    formValidator: { validate: validateStableState },
    formSubmitter,
    syncDerivedFieldState,
    shouldResetInactiveFields,
    inactiveFieldPolicy: config.inactiveFieldPolicy,
    bumpLifecycleVersion,
    resetReports,
    runBehaviorValueChanges,
    abortBehaviorChanges,
    setRestingStatus,
  });

  syncDerivedFieldState({
    values: getValues(),
    preserveValidationErrors: false,
    preserveExternalErrors: false,
    resetInactiveToInitial: shouldResetInactiveFields(),
    inactiveFieldPolicy: config.inactiveFieldPolicy,
  });
  validateBehaviors();

  return controller;
};
