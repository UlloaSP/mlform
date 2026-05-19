// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { EngineStore } from "../state";

export const storePendingReportPatch = (
  store: EngineStore,
  reportId: string,
  patch: unknown,
): void => {
  store.update((current) => ({
    ...current,
    submissionProgress: current.submissionProgress
      ? {
          ...current.submissionProgress,
          meta: {
            ...current.submissionProgress.meta,
            pendingReportPatches: {
              ...(current.submissionProgress.meta.pendingReportPatches as
                | Record<string, unknown>
                | undefined),
              [reportId]: patch,
            },
          },
        }
      : current.submissionProgress,
  }));
};
