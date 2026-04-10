// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { shallowEquality } from "./equality";
import { EngineError } from "./errors";
import { createFieldController, type InternalFieldController, type RefreshOptions } from "./fields";
import { createReportController, type InternalReportController } from "./reports";
import { normalizeSchema } from "./schema";
import {
  createInitialEngineState,
  createStore,
  toFormState,
  transitionEngineState,
  type InternalFieldState,
} from "./state";
import { createFormSubmitter } from "./submission";
import { createFormValidator } from "./validation";
import type {
  CreateFormConfig,
  FormController,
  FormState,
  InactiveFieldPolicy,
  SelectorSubscriptionOptions,
  SingleTransportConfig,
} from "./types";

const isSingleTransportConfig = (
  config: CreateFormConfig,
): config is CreateFormConfig & SingleTransportConfig => {
  return "transport" in config && config.transport !== undefined;
};

export const createForm = (config: CreateFormConfig): FormController => {
  const normalizedSchema = normalizeSchema(config.schema, config.registry);
  const store = createStore(createInitialEngineState(), {
    listenerErrorPolicy: config.listenerErrorPolicy ?? "ignore",
    onListenerError: config.onListenerError,
  });

  const getValues = () => toFormState(store.getState()).values;
  const getSubmitCount = () => store.getState().submitCount;
  const getFormStatus = () => store.getState().status;
  const shouldResetInactiveFields = () => config.inactiveFieldPolicy === "reset-on-hide";
  const resolveInactiveFieldPolicy = (field: {
    readonly config: { readonly inactiveFieldPolicy?: InactiveFieldPolicy };
  }): InactiveFieldPolicy => {
    return field.config.inactiveFieldPolicy ?? config.inactiveFieldPolicy ?? "omit";
  };

  const fields: InternalFieldController[] = normalizedSchema.fields.map((fieldConfig) => {
    const definition = config.registry.getField(fieldConfig.kind);
    if (!definition) {
      throw new EngineError(
        `Field definition "${fieldConfig.kind}" disappeared during form creation.`,
      );
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
      getValues,
      getSubmitCount,
      getFormStatus,
      onValueChange: (_fieldId, nextValues) => {
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
      },
    });
  });

  const reports: InternalReportController[] = normalizedSchema.reports.map((reportConfig) => {
    const definition = config.registry.getReport(reportConfig.kind);
    if (!definition) {
      throw new EngineError(
        `Report definition "${reportConfig.kind}" disappeared during form creation.`,
      );
    }

    return createReportController({
      config: reportConfig,
      definition,
      store,
    });
  });

  const fieldMap = new Map<string, InternalFieldController>(
    fields.map((field) => [field.id, field]),
  );
  const reportMap = new Map<string, InternalReportController>(
    reports.map((report) => [report.id, report]),
  );

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

  function syncDerivedFieldState(options?: RefreshOptions): void {
    store.batch(() => {
      const derivedValues =
        options?.resetInactiveToInitial === true
          ? { ...(options.values ?? getValues()) }
          : options?.values;

      for (const field of fields) {
        const nextState = field.refresh({
          ...options,
          values: derivedValues,
          inactiveFieldPolicy: options?.inactiveFieldPolicy ?? config.inactiveFieldPolicy,
        });

        if (derivedValues) {
          derivedValues[field.id] = nextState.value;
        }
      }
    });
  }

  const setRestingStatus = (): void => {
    store.batch(() => {
      const snapshot = toFormState(store.getState());
      store.update((current) =>
        transitionEngineState(current, {
          type: "rest",
          status: snapshot.dirty || snapshot.touched ? "editing" : "idle",
        }),
      );

      syncDerivedFieldState({
        preserveValidationErrors: true,
        preserveExternalErrors: true,
        resetInactiveToInitial: shouldResetInactiveFields(),
        inactiveFieldPolicy: config.inactiveFieldPolicy,
      });
    });
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

  const formSubmitter = isSingleTransportConfig(config)
    ? createFormSubmitter({
        store,
        transport: config.transport,
        hooks: config.hooks,
        hookFailurePolicy: config.hookFailurePolicy,
        normalizedSchema,
        fields,
        reports,
        validate: () => formValidator.validate(),
        getSubmitCount,
        markReportsLoading,
        resetReports,
        syncDerivedFieldState,
        shouldResetInactiveFields,
        resolveInactiveFieldPolicy,
        inactiveFieldPolicy: config.inactiveFieldPolicy,
      })
    : createFormSubmitter({
        store,
        transports: config.transports,
        defaultBackend: config.defaultBackend,
        hooks: config.hooks,
        hookFailurePolicy: config.hookFailurePolicy,
        normalizedSchema,
        fields,
        reports,
        validate: () => formValidator.validate(),
        getSubmitCount,
        markReportsLoading,
        resetReports,
        syncDerivedFieldState,
        shouldResetInactiveFields,
        resolveInactiveFieldPolicy,
        inactiveFieldPolicy: config.inactiveFieldPolicy,
      });

  const controller: FormController = {
    get fields() {
      return fields;
    },
    get reports() {
      return reports;
    },
    get state() {
      return toFormState(store.getState());
    },
    getField(id) {
      return fieldMap.get(id);
    },
    getReport(id) {
      return reportMap.get(id);
    },
    getValues() {
      return getValues();
    },
    setValues(values) {
      store.batch(() => {
        const updates = Object.entries(values);
        const finalValues = {
          ...getValues(),
        };
        const preparedFieldStates = new Map<string, InternalFieldState>();

        for (const [fieldId, value] of updates) {
          const field = fieldMap.get(fieldId);
          if (!field) {
            throw new EngineError(`Unknown field "${fieldId}".`);
          }

          finalValues[fieldId] = field.coerceValue(value);
        }

        for (const [fieldId, value] of updates) {
          const field = fieldMap.get(fieldId);
          if (!field) {
            throw new EngineError(`Unknown field "${fieldId}".`);
          }

          preparedFieldStates.set(fieldId, field.prepareValue(value, finalValues));
        }

        bumpLifecycleVersion();

        for (const [fieldId, nextState] of preparedFieldStates) {
          const field = fieldMap.get(fieldId);
          if (!field) {
            throw new EngineError(`Unknown field "${fieldId}".`);
          }

          field.commitState(nextState);
        }

        store.update((current) =>
          transitionEngineState(current, {
            type: "editing",
            clearFormErrors: true,
          }),
        );

        syncDerivedFieldState({
          values: finalValues,
          preserveValidationErrors: false,
          preserveExternalErrors: false,
          resetInactiveToInitial: shouldResetInactiveFields(),
          inactiveFieldPolicy: config.inactiveFieldPolicy,
        });
      });
    },
    validate() {
      return formValidator.validate();
    },
    submit(options) {
      return formSubmitter.submit(options);
    },
    abortSubmit(reason) {
      formSubmitter.abort(reason);
    },
    reset() {
      store.batch(() => {
        formSubmitter.abort("reset");
        bumpLifecycleVersion();

        for (const field of fields) {
          field.reset();
        }
        resetReports();
        formSubmitter.reset();

        store.update((current) => transitionEngineState(current, { type: "reset" }));

        syncDerivedFieldState({
          preserveValidationErrors: false,
          preserveExternalErrors: false,
        });
      });
    },
    subscribe(listener) {
      return store.subscribe(() => {
        listener(this.state);
      });
    },
    subscribeSelector<TSelected>(
      selector: (state: FormState) => TSelected,
      listener: (selected: TSelected, state: FormState) => void,
      options?: SelectorSubscriptionOptions<TSelected>,
    ) {
      const equality = options?.equality ?? shallowEquality<TSelected>;
      let previousSelected = selector(this.state);

      if (options?.emitInitial) {
        listener(previousSelected, this.state);
      }

      return store.subscribe(() => {
        const nextState = this.state;
        const nextSelected = selector(nextState);
        if (!equality(previousSelected, nextSelected)) {
          previousSelected = nextSelected;
          listener(nextSelected, nextState);
        }
      });
    },
  };

  syncDerivedFieldState({
    preserveValidationErrors: false,
    preserveExternalErrors: false,
    resetInactiveToInitial: shouldResetInactiveFields(),
    inactiveFieldPolicy: config.inactiveFieldPolicy,
  });

  return controller;
};
