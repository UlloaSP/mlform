// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { primitiveEventNames } from "./constants";
import type { PrimitiveFormController } from "./controller-types";
import type { PrimitiveSubmitExecutionResult } from "./types";

/** Execute a UI submission and dispatch the same lifecycle events from any form host. */
export const executePrimitiveSubmit = async (
  host: HTMLElement,
  form: PrimitiveFormController,
  execute: () => Promise<PrimitiveSubmitExecutionResult> = async () => ({
    result: await form.submit(),
  }),
): Promise<PrimitiveSubmitExecutionResult> => {
  const emit = (name: string, detail: Record<string, unknown>) => {
    const Event = host.ownerDocument.defaultView?.CustomEvent ?? CustomEvent;
    host.dispatchEvent(
      new Event(name, {
        detail: { form, state: form.state, ...detail },
        bubbles: true,
        composed: true,
      }),
    );
  };
  emit(primitiveEventNames.submitStart, {});
  try {
    const execution = await execute();
    emit(primitiveEventNames.submitSuccess, { ...execution });
    return execution;
  } catch (error) {
    const aborted =
      error instanceof Error &&
      (error.name === "SubmissionAbortedError" || error.name === "AbortError");
    emit(aborted ? primitiveEventNames.submitAbort : primitiveEventNames.submitError, {
      error,
      status: form.state.submissionStatus,
    });
    throw error;
  }
};
