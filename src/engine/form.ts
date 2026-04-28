// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { shallowEquality } from "./equality";
import { EngineError } from "./errors";
import { createExplanationController, type InternalExplanationController } from "./explanations";
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
import { slugify } from "./utils";
import { cloneValue } from "./values";
import type {
  CreateFormConfig,
  FormController,
  FormState,
  InactiveFieldPolicy,
  SelectorSubscriptionOptions,
} from "./types";

const assertTransport = (transport: CreateFormConfig["transport"]): void => {
  if (!transport || typeof transport.submit !== "function") {
    throw new EngineError("createForm requires a transport with a submit(request) function.");
  }
};

export const createForm = (config: CreateFormConfig): FormController => {
  assertTransport(config.transport);
  const normalizedSchema = normalizeSchema(config.schema, config.registry);
  const store = createStore(createInitialEngineState(), {
    listenerErrorPolicy: config.listenerErrorPolicy ?? "ignore",
    onListenerError: config.onListenerError,
  });

  let cachedSourceState = store.getState();
  let cachedFormState = toFormState(cachedSourceState);

  const getPublicState = (): FormState => {
    const nextState = store.getState();
    if (nextState !== cachedSourceState) {
      cachedSourceState = nextState;
      cachedFormState = toFormState(nextState);
    }

    return cachedFormState;
  };

  const getValues = () =>
    Object.fromEntries(
      Object.entries(store.getState().fieldStates).map(([fieldId, fieldState]) => [
        fieldId,
        cloneValue(fieldState.value),
      ]),
    );
  const getSubmitCount = () => store.getState().submitCount;
  const getFormStatus = () => store.getState().status;
  const hasInteractiveFieldState = (fieldStates: Record<string, InternalFieldState>): boolean => {
    for (const fieldId in fieldStates) {
      const fieldState = fieldStates[fieldId];
      if (fieldState?.dirty || fieldState?.touched) {
        return true;
      }
    }

    return false;
  };
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

          applyMappedCategoryEffects(_fieldId, nextValues);
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

  const explanations: InternalExplanationController[] = normalizedSchema.explanations.map(
    (explanationConfig) => {
      const definition = config.registry.getExplanation(explanationConfig.kind);
      if (!definition) {
        throw new EngineError(
          `Explanation definition "${explanationConfig.kind}" disappeared during form creation.`,
        );
      }

      return createExplanationController({
        config: explanationConfig,
        definition,
        store,
        hooks: config.hooks,
      });
    },
  );

  const fieldMap = new Map<string, InternalFieldController>(
    fields.map((field) => [field.id, field]),
  );
  const resolveMappedTargetField = (targetId: string): InternalFieldController | undefined => {
    return fieldMap.get(targetId) ?? fieldMap.get(slugify(targetId));
  };

  // Build mapped-category lookup and validate mapping targets
  const mappedCategoryConfigs = new Map<
    string,
    { options: Array<{ label: string; value: string; mapping: Record<string, unknown> }> }
  >();
  for (const field of fields) {
    if (field.kind === "mapped-category") {
      const fieldConfig = field.config as unknown as {
        options: Array<{ label: string; value: string; mapping: Record<string, unknown> }>;
      };
      // Validate all mapping targets exist
      for (const option of fieldConfig.options) {
        if (option.mapping) {
          for (const targetId of Object.keys(option.mapping)) {
            if (!resolveMappedTargetField(targetId)) {
              throw new EngineError(
                `mapped-category "${field.id}": mapping references unknown field "${targetId}".`,
              );
            }
          }
        }
      }
      mappedCategoryConfigs.set(field.id, fieldConfig);
    }
  }

  const applyMappedCategoryEffects = (
    fieldId: string,
    nextValues: Record<string, unknown>,
  ): void => {
    const masterConfig = mappedCategoryConfigs.get(fieldId);
    if (!masterConfig) return;

    const selectedValue = nextValues[fieldId];
    const selectedOption = masterConfig.options.find((opt) => opt.value === selectedValue);
    if (!selectedOption?.mapping) return;

    for (const [targetId, targetValue] of Object.entries(selectedOption.mapping)) {
      const targetField = resolveMappedTargetField(targetId);
      if (!targetField) {
        throw new EngineError(
          `mapped-category "${fieldId}": target field "${targetId}" not found in schema.`,
        );
      }

      const coerced = targetField.coerceValue(targetValue);

      // Validate coerced value against target field definition
      const targetDef = config.registry.getField(targetField.kind);
      if (targetDef?.validate) {
        const errors = targetDef.validate(coerced, targetField.config, {
          field: targetField.config,
          values: nextValues,
          submitCount: getSubmitCount(),
          validationVersion: 0,
        });
        if (Array.isArray(errors) && errors.length > 0) {
          throw new EngineError(
            `mapped-category "${fieldId}": value ${JSON.stringify(targetValue)} invalid for "${targetId}": ${errors.join(", ")}`,
          );
        }
      }

      const currentState = store.getState().fieldStates[targetField.id];
      if (currentState) {
        targetField.commitState({
          ...currentState,
          value: coerced,
        });
      }
    }
  };

  const reportMap = new Map<string, InternalReportController>(
    reports.map((report) => [report.id, report]),
  );
  const explanationMap = new Map<string, InternalExplanationController>(
    explanations.map((explanation) => [explanation.id, explanation]),
  );
  const readonlyFields = Object.freeze([...fields]) as readonly InternalFieldController[];
  const readonlyReports = Object.freeze([...reports]) as readonly InternalReportController[];
  const readonlyExplanations = Object.freeze([
    ...explanations,
  ]) as readonly InternalExplanationController[];

  const resetReports = (): void => {
    for (const report of reports) {
      report.reset();
    }
  };

  const resetExplanations = (): void => {
    for (const explanation of explanations) {
      explanation.reset();
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
      const nextStatus = hasInteractiveFieldState(store.getState().fieldStates)
        ? "editing"
        : "idle";
      store.update((current) =>
        transitionEngineState(current, {
          type: "rest",
          status: nextStatus,
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

  const formSubmitter = createFormSubmitter({
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
    resetExplanations,
    syncDerivedFieldState,
    shouldResetInactiveFields,
    resolveInactiveFieldPolicy,
    inactiveFieldPolicy: config.inactiveFieldPolicy,
  });

  const controller: FormController = {
    get fields() {
      return readonlyFields;
    },
    get reports() {
      return readonlyReports;
    },
    get explanations() {
      return readonlyExplanations;
    },
    get state() {
      return getPublicState();
    },
    getField(id) {
      return fieldMap.get(id);
    },
    getReport(id) {
      return reportMap.get(id);
    },
    getExplanation(id) {
      return explanationMap.get(id);
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

        for (const [fieldId] of updates) {
          applyMappedCategoryEffects(fieldId, finalValues);
        }
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
        resetExplanations();
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
        listener(getPublicState());
      });
    },
    subscribeSelector<TSelected>(
      selector: (state: FormState) => TSelected,
      listener: (selected: TSelected, state: FormState) => void,
      options?: SelectorSubscriptionOptions<TSelected>,
    ) {
      const equality = options?.equality ?? shallowEquality<TSelected>;
      let previousSelected = selector(getPublicState());

      if (options?.emitInitial) {
        listener(previousSelected, getPublicState());
      }

      return store.subscribe(() => {
        const nextState = getPublicState();
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
