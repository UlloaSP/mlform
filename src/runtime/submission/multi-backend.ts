// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { createReportFetchRequest } from "@/schema";
import { createAbortError, isAbortLikeError } from "../errors";
import type { FormController, SubmitResult } from "../types";
import { executeReportFetches } from "./report-fetches";
import { createSubmissionSnapshot, type SubmissionSnapshot } from "./snapshot";
import { assertUniqueBackendIdentities } from "./backend";

export interface MultiBackendSubmit {
  backend: string;
  signal?: AbortSignal;
}

export interface MultiBackendRunResult {
  backend: string;
  snapshot: SubmissionSnapshot;
  submitResult?: SubmitResult;
  reportFetchResults: Record<string, unknown>;
  reportFetchErrors: Record<string, string>;
  skippedReportIds: string[];
  error?: unknown;
}

export interface ExecuteMultiBackendPipelineOptions {
  form: FormController;
  backends: readonly (string | MultiBackendSubmit)[];
  reportFetchMode?: "none" | "all";
  continueOnError?: boolean;
}

export interface MultiBackendPipelineResult {
  runs: Record<string, MultiBackendRunResult>;
}

const normalizeSubmit = (entry: string | MultiBackendSubmit): MultiBackendSubmit =>
  typeof entry === "string" ? { backend: entry } : entry;

const normalizeSubmits = (
  entries: readonly (string | MultiBackendSubmit)[],
): MultiBackendSubmit[] => {
  const submits = entries.map(normalizeSubmit);
  assertUniqueBackendIdentities(submits.map(({ backend }) => backend));
  return submits;
};

const skippedReports = (
  reports: readonly FormController["reports"][number][],
  fetched: Record<string, unknown>,
  failed: Record<string, string>,
): string[] =>
  reports
    .filter((report) => !(report.id in fetched) && !(report.id in failed))
    .map((report) => report.id);

export const executeMultiBackendPipeline = async ({
  form,
  backends,
  reportFetchMode = "all",
  continueOnError = true,
}: ExecuteMultiBackendPipelineOptions): Promise<MultiBackendPipelineResult> => {
  const runs: Record<string, MultiBackendRunResult> = {};
  const submits = normalizeSubmits(backends);

  for (const submit of submits) {
    const backend = submit.backend;

    const snapshot = createSubmissionSnapshot(form, { backend });
    try {
      const submitResult = await form.submit(submit);
      const fetchState =
        reportFetchMode === "all"
          ? await executeReportFetches({
              reports: form.reports,
              request: createReportFetchRequest(submitResult, { signal: submit.signal }),
            })
          : { results: {}, errors: {} };

      runs[backend] = {
        backend,
        snapshot,
        submitResult,
        reportFetchResults: fetchState.results,
        reportFetchErrors: fetchState.errors,
        skippedReportIds: skippedReports(form.reports, fetchState.results, fetchState.errors),
      };
    } catch (error) {
      if (isAbortLikeError(error) || submit.signal?.aborted) {
        throw isAbortLikeError(error)
          ? error
          : createAbortError(
              submit.signal?.reason instanceof Error
                ? submit.signal.reason.message
                : String(submit.signal?.reason ?? ""),
            );
      }
      runs[backend] = {
        backend,
        snapshot,
        reportFetchResults: {},
        reportFetchErrors: {},
        skippedReportIds: form.reports.map((report) => report.id),
        error,
      };
      if (!continueOnError) {
        throw error;
      }
    }
  }

  return { runs };
};
