// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { EngineError } from "./errors";
import type { InternalFieldController, RefreshOptions } from "./fields";
import type { InternalReportController } from "./reports";
import { createFormSnapshot, parseFormSnapshot } from "./snapshots";
import { transitionEngineState, type EngineStore, type InternalFieldState } from "./state";
import type { FormSnapshot, RuntimeBehaviorValueChangeEvent } from "./types";
import { deepValueEquality } from "./values";

type RuntimeSnapshotsOptions = {
  store: EngineStore;
  fields: readonly InternalFieldController[];
  reports: readonly InternalReportController[];
  refreshOptions: RefreshOptions;
  abortBehaviorChanges(reason?: string): void;
  abortSubmission(reason?: string): void;
  resetSubmission(): void;
  resetReports(): void;
  runBehaviorValueChanges(events: readonly RuntimeBehaviorValueChangeEvent[]): void;
};

const prepareFieldStates = (
  fields: readonly InternalFieldController[],
  entries: ReturnType<typeof parseFormSnapshot>,
  refreshOptions: RefreshOptions,
): Map<string, InternalFieldState> => {
  let values = Object.fromEntries(
    fields.map((field) => {
      const entry = entries.get(field.id);
      if (!entry) throw new EngineError(`Snapshot field "${field.id}" is missing.`);
      return [field.id, field.restoreSnapshotValue(entry.value)];
    }),
  );
  const maximumPasses = fields.length + 1;

  for (let pass = 0; pass < maximumPasses; pass += 1) {
    const states = new Map<string, InternalFieldState>();
    const nextValues = { ...values };
    let changed = false;

    for (const field of fields) {
      const entry = entries.get(field.id)!;
      const state = field.prepareRestoredState(
        values[field.id],
        values,
        entry.touched,
        refreshOptions,
      );
      states.set(field.id, state);
      nextValues[field.id] = state.value;
      if (!deepValueEquality(values[field.id], state.value)) changed = true;
    }

    if (!changed) return states;
    values = nextValues;
  }

  throw new EngineError("Restored field state did not stabilize.");
};

export const createRuntimeSnapshots = (options: RuntimeSnapshotsOptions) => ({
  create(): FormSnapshot {
    return createFormSnapshot(options.fields, options.reports);
  },
  restore(snapshot: unknown): void {
    const entries = parseFormSnapshot(snapshot, options.fields, options.reports);
    const states = prepareFieldStates(options.fields, entries, options.refreshOptions);
    const events = options.fields.map((field): RuntimeBehaviorValueChangeEvent => ({
      fieldId: field.id,
      values: Object.fromEntries(
        options.fields.map((entry) => [entry.id, states.get(entry.id)!.value]),
      ),
    }));

    options.store.batch(() => {
      options.abortBehaviorChanges("restore");
      options.abortSubmission("restore");
      for (const field of options.fields) field.abortValidation("restore");
      options.resetSubmission();
      options.resetReports();
      options.store.update((current) => transitionEngineState(current, { type: "restore" }));
      for (const field of options.fields) field.commitState(states.get(field.id)!);
      options.runBehaviorValueChanges(events);
    });
  },
});
