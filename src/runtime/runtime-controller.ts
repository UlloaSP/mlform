// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { shallowEquality } from "./equality";
import { EngineError } from "./errors";
import { mappedToKey } from "@/schema";
import { transitionEngineState, type InternalFieldState } from "./state";
import type {
  FormController,
  FormState,
  SelectorSubscriptionOptions,
  RuntimeBehaviorValueChangeEvent,
} from "./types";
import type { InternalFieldController } from "./fields";
import type { InternalReportController } from "./reports";
import type { EngineStore } from "./state";

type CreateRuntimeControllerOptions = {
  fields: InternalFieldController[];
  reports: InternalReportController[];
  fieldMap: Map<string, InternalFieldController>;
  reportMap: Map<string, InternalReportController>;
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
  runBehaviorValueChange: (event: RuntimeBehaviorValueChangeEvent) => void;
  abortBehaviorChanges: (reason?: string) => void;
  setRestingStatus: () => void;
};

export const createRuntimeController = ({
  fields,
  reports,
  fieldMap,
  reportMap,
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
  runBehaviorValueChange,
  abortBehaviorChanges,
  setRestingStatus,
}: CreateRuntimeControllerOptions): FormController => {
  const readonlyFields = Object.freeze([...fields]) as readonly InternalFieldController[];
  const readonlyReports = Object.freeze([...reports]) as readonly InternalReportController[];
  let disposed = false;
  const assertActive = (): void => {
    if (disposed) throw new EngineError("Form runtime has been disposed.");
  };

  return {
    get fields() {
      return readonlyFields;
    },
    get reports() {
      return readonlyReports;
    },
    get state() {
      return getPublicState();
    },
    getField(id) {
      return fieldMap.get(id);
    },
    getFieldByDisplayKey(displayKey) {
      const target = displayKey.trim();
      return fields.find((field) => field.config.displayKey?.trim() === target);
    },
    getFieldByMappedTo(target, options) {
      const targetKey = mappedToKey(target);
      return fields.find((field) => {
        return field
          .getMappedTargets(options?.backend)
          .some((mappedTo) => mappedToKey(mappedTo) === targetKey);
      });
    },
    getReport(id) {
      return reportMap.get(id);
    },
    getValues() {
      return getValues();
    },
    setValues(values) {
      assertActive();
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
            values: finalValues,
          });
        }
      });
    },
    validate() {
      assertActive();
      return formValidator.validate();
    },
    submit(options) {
      assertActive();
      return formSubmitter.submit(options);
    },
    abortSubmit(reason) {
      formSubmitter.abort(reason);
    },
    setExternalErrors(issue) {
      assertActive();
      const unknownFieldIds = Object.keys(issue.fields ?? {}).filter(
        (fieldId) => !fieldMap.has(fieldId),
      );
      if (unknownFieldIds.length > 0) {
        throw new EngineError(`Unknown field "${unknownFieldIds[0]}" in external errors.`);
      }

      store.batch(() => {
        for (const field of fields) field.setExternalErrors(issue.fields?.[field.id] ?? []);
        const formErrors = [...(issue.form ?? [])];
        store.update((current) => ({
          ...current,
          formErrors,
          status:
            formErrors.length > 0 ||
            Object.values(issue.fields ?? {}).some((errors) => errors.length)
              ? "error"
              : current.status,
        }));
      });
    },
    clearExternalErrors() {
      assertActive();
      store.batch(() => {
        for (const field of fields) field.setExternalErrors([]);
        store.update((current) => ({ ...current, formErrors: [] }));
        setRestingStatus();
      });
    },
    reset() {
      assertActive();
      store.batch(() => {
        abortBehaviorChanges("reset");
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
      assertActive();
      return store.subscribe(() => {
        listener(getPublicState());
      });
    },
    subscribeSelector<TSelected>(
      selector: (state: FormState) => TSelected,
      listener: (selected: TSelected, state: FormState) => void,
      options?: SelectorSubscriptionOptions<TSelected>,
    ) {
      assertActive();
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
    dispose() {
      if (disposed) return;
      abortBehaviorChanges("dispose");
      formSubmitter.abort("dispose");
      bumpLifecycleVersion();
      for (const field of fields) field.dispose();
      for (const report of reports) report.dispose();
      disposed = true;
      store.destroy();
    },
  };
};
