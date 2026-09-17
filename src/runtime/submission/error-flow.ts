// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { createAbortError, SubmissionAbortedError, SubmitError } from "../errors";
import { extractErrorMessage } from "@/transport";
import type { EngineStore } from "../state";
import type { FormHooks } from "../types";
import { notifyListenerError } from "../utils";
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
  onListenerError?: (error: unknown) => void;
};

export const createSubmissionErrorFlow = ({
  hooks,
  abortManager,
  lifecycle,
  store,
  onListenerError,
}: CreateSubmissionErrorFlowOptions) => {
  const notifySubmitError = async (
    backend: string | undefined,
    records: SubmissionValueRecords,
    submitCount: number,
    error: unknown,
  ): Promise<void> => {
    const publicRecords = cloneSubmissionValueRecords(records);
    try {
      await hooks?.onSubmitError?.({
        backend,
        ...publicRecords,
        submitCount,
        error,
      });
    } catch (hookError) {
      notifyListenerError(onListenerError, hookError);
    }
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
    const message = extractErrorMessage(error);

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
