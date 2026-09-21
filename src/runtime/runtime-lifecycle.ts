// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { EngineError } from "./errors";
import { transitionEngineState, type EngineStore } from "./state";
import type { InternalFieldController } from "./fields";
import type { InternalReportController } from "./reports";

type RuntimeLifecycleOptions = {
  store: EngineStore;
  fields: readonly InternalFieldController[];
  reports: readonly InternalReportController[];
  abortBehaviorChanges: (reason?: string) => void;
  formSubmitter: {
    abort(reason?: string): void;
    reset(): void;
  };
  cancelExplicitValidations: () => void;
};

export const createRuntimeLifecycle = ({
  store,
  fields,
  reports,
  abortBehaviorChanges,
  formSubmitter,
  cancelExplicitValidations,
}: RuntimeLifecycleOptions) => {
  let disposed = false;
  const assertUsable = (): void => {
    if (disposed) throw new EngineError("Form runtime has been disposed.");
  };
  const assertActive = (): void => {
    assertUsable();
    if (store.getState().lifecycle === "suspended") {
      throw new EngineError("Form runtime is suspended.");
    }
  };

  return {
    assertUsable,
    assertActive,
    suspend(reason?: string) {
      assertUsable();
      if (store.getState().lifecycle === "suspended") return;

      const suspendReason = reason ?? "suspend";
      store.batch(() => {
        abortBehaviorChanges(suspendReason);
        formSubmitter.abort(suspendReason);
        formSubmitter.reset();
        cancelExplicitValidations();
        for (const field of fields) field.abortValidation(suspendReason);
        for (const report of reports) report.suspend(suspendReason);
        store.update((current) =>
          transitionEngineState(current, { type: "suspend", message: reason }),
        );
      });
    },
    resume() {
      assertUsable();
      if (store.getState().lifecycle === "active") return;
      store.update((current) => transitionEngineState(current, { type: "resume" }));
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      try {
        abortBehaviorChanges("dispose");
        formSubmitter.abort("dispose");
        store.update((current) => transitionEngineState(current, { type: "dispose" }));
      } finally {
        for (const field of fields) field.dispose();
        for (const report of reports) report.dispose();
        store.destroy();
      }
    },
  };
};
