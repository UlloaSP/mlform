// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { transitionEngineState, type InternalFieldState } from "./state";
import type { RefreshOptions, InternalFieldController } from "./fields";
import type { EngineStore } from "./state";

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
      const derivedValues =
        options?.resetInactiveToInitial === true ? { ...options.values } : options?.values;

      for (const field of fields) {
        const nextState = field.refresh({
          ...options,
          values: derivedValues,
          inactiveFieldPolicy: options?.inactiveFieldPolicy ?? inactiveFieldPolicy,
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
        inactiveFieldPolicy,
      });
    });
  };

  return {
    syncDerivedFieldState,
    setRestingStatus,
  };
};
