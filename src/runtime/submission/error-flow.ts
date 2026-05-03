// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { createAbortError, SubmissionAbortedError, SubmitError } from "../errors";
import type { EngineStore } from "../state";
import type { FormHooks } from "../types";
import { cloneSubmissionValueRecords, type SubmissionValueRecords } from "./request";
import type { createSubmissionAbortManager } from "./abort";
import type { createSubmissionLifecycle } from "./lifecycle";

type AbortManager = ReturnType<typeof createSubmissionAbortManager>;
type Lifecycle = ReturnType<typeof createSubmissionLifecycle>;

type CreateSubmissionErrorFlowOptions = {
  hooks: FormHooks | undefined;
  abortManager: AbortManager;
  lifecycle: Lifecycle;
  store: EngineStore;
};

export const createSubmissionErrorFlow = ({
  hooks,
  abortManager,
  lifecycle,
  store,
}: CreateSubmissionErrorFlowOptions) => {
  const notifySubmitError = async (
    backend: string | undefined,
    records: SubmissionValueRecords,
    submitCount: number,
    error: unknown,
  ): Promise<void> => {
    const publicRecords = cloneSubmissionValueRecords(records);
    await hooks?.onSubmitError?.({
      backend,
      ...publicRecords,
      submitCount,
      error,
    });
  };

  const handleSubmissionAbort = async (
    error: unknown,
    submissionRequestId: number,
    lifecycleVersion: number,
    submitCount: number,
    records: SubmissionValueRecords,
    backend: string | undefined,
  ): Promise<never> => {
    const abortedError =
      error instanceof SubmissionAbortedError
        ? error
        : createAbortError(abortManager.getAbortReason(submissionRequestId));

    if (
      abortManager.getCurrentRequestId() === submissionRequestId &&
      store.getState().lifecycleVersion === lifecycleVersion
    ) {
      lifecycle.abort(abortedError.message);
    }

    await notifySubmitError(backend, records, submitCount, abortedError);
    throw abortedError;
  };

  const handleSubmissionError = async (
    error: unknown,
    submissionRequestId: number,
    lifecycleVersion: number,
    submitCount: number,
    records: SubmissionValueRecords,
    backend: string | undefined,
  ): Promise<never> => {
    const message = error instanceof Error ? error.message : String(error);

    if (
      abortManager.getCurrentRequestId() === submissionRequestId &&
      store.getState().lifecycleVersion === lifecycleVersion
    ) {
      lifecycle.fail(message);
    }

    await notifySubmitError(backend, records, submitCount, error);
    throw new SubmitError(`Form submission failed: ${message}`, error);
  };

  return {
    notifySubmitError,
    handleSubmissionAbort,
    handleSubmissionError,
  };
};
