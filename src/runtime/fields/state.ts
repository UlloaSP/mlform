// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { EngineStore, InternalFieldState } from "../state";

export const setFieldState = (
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
