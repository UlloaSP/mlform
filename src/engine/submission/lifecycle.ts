// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { transitionEngineState, type EngineStore } from "../state";
import type { SubmitResult } from "../types";

type SubmissionTransitionOptions = {
  store: EngineStore;
  resetReports: () => void;
  syncAfterSubmissionTransition: () => void;
};

export const createSubmissionLifecycle = ({
  store,
  resetReports,
  syncAfterSubmissionTransition,
}: SubmissionTransitionOptions) => {
  return {
    start(submissionVersion: number) {
      store.update((current) =>
        transitionEngineState(current, {
          type: "start-submission",
          submissionVersion,
        }),
      );

      syncAfterSubmissionTransition();
    },
    succeed(result: SubmitResult) {
      store.update((current) =>
        transitionEngineState(current, {
          type: "submission-success",
          result,
        }),
      );

      syncAfterSubmissionTransition();
    },
    abort(message: string) {
      resetReports();
      store.update((current) =>
        transitionEngineState(current, {
          type: "submission-aborted",
          message,
        }),
      );

      syncAfterSubmissionTransition();
    },
    fail(message: string) {
      resetReports();
      store.update((current) =>
        transitionEngineState(current, {
          type: "submission-error",
          message,
        }),
      );

      syncAfterSubmissionTransition();
    },
    clear(submissionVersion: number) {
      store.update((current) =>
        transitionEngineState(current, {
          type: "clear-active-submission",
          submissionVersion,
        }),
      );
    },
  };
};
