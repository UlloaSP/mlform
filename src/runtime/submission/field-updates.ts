// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { toSnapshotState } from "../validation";
import type { EngineStore } from "../state";
import type { TransportStreamEvent } from "../types";
import type { LiveSubmissionField } from "./types";

type CreateFieldUpdatesOptions = {
  store: EngineStore;
  fieldMap: Map<string, LiveSubmissionField>;
  onRemoteFieldUpdate?: (fieldId: string) => Promise<void>;
};

export const createFieldUpdates = ({
  store,
  fieldMap,
  onRemoteFieldUpdate,
}: CreateFieldUpdatesOptions) => {
  const applyFieldUpdate = (
    event: Extract<TransportStreamEvent, { type: "field-update" }>,
  ): void => {
    const field = fieldMap.get(event.fieldId);
    if (!field) {
      return;
    }

    const current = store.getState().fieldStates[event.fieldId];
    if (!current) {
      return;
    }

    const nextValue = event.value !== undefined ? field.coerceValue(event.value) : current.value;
    field.commitState(
      toSnapshotState({
        ...current,
        value: nextValue,
        touched: event.touched ?? current.touched,
        dirty: event.dirty ?? current.dirty,
        externalErrors: event.errors ? [...event.errors] : current.externalErrors,
      }),
    );
    void onRemoteFieldUpdate?.(event.fieldId);
  };

  return {
    applyFieldUpdate,
  };
};
