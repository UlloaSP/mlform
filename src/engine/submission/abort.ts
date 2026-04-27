// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { createAbortError, EngineError } from "../errors";
import type { SubmitOptions } from "../types";

export type SubmissionAbortManager = {
  ensureIdle(): void;
  begin(): number;
  getCurrentRequestId(): number | null;
  getAbortReason(requestId: number): string;
  isAborted(requestId: number): boolean;
  setActiveController(requestId: number, controller: AbortController | null): void;
  createSignal(options?: SubmitOptions): AbortSignal;
  attachExternalSignal(options: SubmitOptions | undefined, requestId: number): void;
  abort(reason?: string): void;
  clear(requestId: number): void;
  reset(): void;
};

export const createSubmissionAbortManager = (): SubmissionAbortManager => {
  let activeAbortController: AbortController | null = null;
  let activeAbortReason = "";
  let currentSubmissionRequestId: number | null = null;
  let submissionRequestSequence = 0;
  const abortedSubmissionReasons = new Map<number, string>();
  const externalSignalCleanup = new Map<number, () => void>();

  const runExternalSignalCleanup = (requestId: number): void => {
    const cleanup = externalSignalCleanup.get(requestId);
    if (!cleanup) {
      return;
    }

    externalSignalCleanup.delete(requestId);
    cleanup();
  };

  return {
    ensureIdle() {
      if (currentSubmissionRequestId !== null) {
        throw new EngineError("Form submission is already in progress.");
      }
    },
    begin() {
      const submissionRequestId = ++submissionRequestSequence;
      currentSubmissionRequestId = submissionRequestId;
      return submissionRequestId;
    },
    getCurrentRequestId() {
      return currentSubmissionRequestId;
    },
    getAbortReason(requestId) {
      return activeAbortReason || abortedSubmissionReasons.get(requestId) || "";
    },
    isAborted(requestId) {
      return abortedSubmissionReasons.has(requestId);
    },
    setActiveController(requestId, controller) {
      activeAbortController = controller;
      activeAbortReason = abortedSubmissionReasons.get(requestId) ?? "";

      if (activeAbortReason && activeAbortController) {
        activeAbortController.abort(activeAbortReason);
      }
    },
    createSignal(options) {
      return activeAbortController?.signal ?? options?.signal ?? new AbortController().signal;
    },
    attachExternalSignal(options, requestId) {
      if (!options?.signal) {
        return;
      }

      if (options.signal.aborted) {
        this.clear(requestId);
        throw createAbortError(String(options.signal.reason ?? ""));
      }

      const onAbort = () => {
        if (currentSubmissionRequestId !== requestId) {
          runExternalSignalCleanup(requestId);
          return;
        }

        activeAbortReason =
          options.signal?.reason instanceof Error
            ? options.signal.reason.message
            : String(options.signal?.reason ?? "");
        activeAbortController?.abort(options.signal?.reason);
        runExternalSignalCleanup(requestId);
      };

      options.signal.addEventListener("abort", onAbort, { once: true });
      externalSignalCleanup.set(requestId, () => {
        options.signal?.removeEventListener("abort", onAbort);
      });
    },
    abort(reason) {
      if (currentSubmissionRequestId === null) {
        return;
      }

      const abortReason = reason ?? "";
      abortedSubmissionReasons.set(currentSubmissionRequestId, abortReason);
      activeAbortReason = abortReason;
      activeAbortController?.abort(abortReason);
    },
    clear(requestId) {
      runExternalSignalCleanup(requestId);

      if (currentSubmissionRequestId === requestId) {
        currentSubmissionRequestId = null;
      }

      activeAbortController = null;
      activeAbortReason = "";
      abortedSubmissionReasons.delete(requestId);
    },
    reset() {
      for (const requestId of externalSignalCleanup.keys()) {
        runExternalSignalCleanup(requestId);
      }

      currentSubmissionRequestId = null;
      activeAbortController = null;
      activeAbortReason = "";
      abortedSubmissionReasons.clear();
    },
  };
};
