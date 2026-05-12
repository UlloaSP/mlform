// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { shallowEquality } from "./equality";
import { EngineError } from "./errors";
import { transitionEngineState, type InternalFieldState } from "./state";
import type {
  FormController,
  FormState,
  SelectorSubscriptionOptions,
  RuntimeBehaviorValueChangeEvent,
} from "./types";
import type { InternalExplanationController } from "./explanations";
import type { InternalFieldController } from "./fields";
import type { InternalReportController } from "./reports";
import type { EngineStore } from "./state";

type CreateRuntimeControllerOptions = {
  fields: InternalFieldController[];
  reports: InternalReportController[];
  explanations: InternalExplanationController[];
  fieldMap: Map<string, InternalFieldController>;
  reportMap: Map<string, InternalReportController>;
  explanationMap: Map<string, InternalExplanationController>;
  store: EngineStore;
  getPublicState: () => FormState;
  getValues: () => Record<string, unknown>;
  getInternalValues: () => Record<string, unknown>;
  formValidator: { validate(): Promise<import("./types").FormValidationResult> };
  formSubmitter: {
    submit(options?: import("./types").SubmitOptions): Promise<import("./types").SubmitResult>;
    abort(reason?: string): void;
    reset(): void;
  };
  syncDerivedFieldState: (options?: import("./fields").RefreshOptions) => void;
  shouldResetInactiveFields: () => boolean;
  inactiveFieldPolicy: import("./types").InactiveFieldPolicy | undefined;
  bumpLifecycleVersion: () => number;
  resetReports: () => void;
  resetExplanations: () => void;
  runBehaviorValueChange: (event: RuntimeBehaviorValueChangeEvent) => void;
};

export const createRuntimeController = ({
  fields,
  reports,
  explanations,
  fieldMap,
  reportMap,
  explanationMap,
  store,
  getPublicState,
  getValues,
  getInternalValues,
  formValidator,
  formSubmitter,
  syncDerivedFieldState,
  shouldResetInactiveFields,
  inactiveFieldPolicy,
  bumpLifecycleVersion,
  resetReports,
  resetExplanations,
  runBehaviorValueChange,
}: CreateRuntimeControllerOptions): FormController => {
  const readonlyFields = Object.freeze([...fields]) as readonly InternalFieldController[];
  const readonlyReports = Object.freeze([...reports]) as readonly InternalReportController[];
  const readonlyExplanations = Object.freeze([
    ...explanations,
  ]) as readonly InternalExplanationController[];

  return {
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
          ...getInternalValues(),
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
          inactiveFieldPolicy,
        });

        for (const [fieldId] of updates) {
          runBehaviorValueChange({
            fieldId,
            source: "local",
            values: finalValues,
          });
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
};
