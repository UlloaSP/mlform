// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { EngineError } from "./errors";
import { transitionEngineState, type InternalFieldState } from "./state";
import type { RefreshOptions, InternalFieldController } from "./fields";
import type { EngineStore } from "./state";
import { deepValueEquality } from "./values";

type CreateRuntimeRefreshOptions = {
  store: EngineStore;
  fields: readonly InternalFieldController[];
  shouldResetInactiveFields: () => boolean;
  inactiveFieldPolicy: RefreshOptions["inactiveFieldPolicy"];
  hasInteractiveFieldState: (fieldStates: Record<string, InternalFieldState>) => boolean;
};

export const createRuntimeRefresh = ({
  store,
  fields,
  shouldResetInactiveFields,
  inactiveFieldPolicy,
  hasInteractiveFieldState,
}: CreateRuntimeRefreshOptions) => {
  function syncDerivedFieldState(options?: RefreshOptions): void {
    store.batch(() => {
      let derivedValues = {
        ...Object.fromEntries(
          Object.entries(store.getState().fieldStates).map(([fieldId, state]) => [
            fieldId,
            state.value,
          ]),
        ),
        ...options?.values,
      };
      const maximumPasses = fields.length + 1;

      for (let pass = 0; pass < maximumPasses; pass += 1) {
        let valuesChanged = false;
        const passValues = { ...derivedValues };
        const nextValues = { ...passValues };

        for (const field of fields) {
          const previousValue = passValues[field.id];
          const nextState = field.refresh({
            ...options,
            values: passValues,
            inactiveFieldPolicy: options?.inactiveFieldPolicy ?? inactiveFieldPolicy,
          });

          if (!deepValueEquality(previousValue, nextState.value)) {
            valuesChanged = true;
          }
          nextValues[field.id] = nextState.value;
        }

        if (!valuesChanged) return;
        derivedValues = nextValues;
      }

      throw new EngineError("Derived field state did not stabilize.");
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
        inactiveFieldPolicy,
      });
    });
  };

  return {
    syncDerivedFieldState,
    setRestingStatus,
  };
};
