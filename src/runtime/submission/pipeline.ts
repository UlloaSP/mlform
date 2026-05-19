// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { executeReportFetches } from "./report-fetches";
import { createReportFetchRequest } from "./report-fetch-request";
import type { ExecuteFormPipelineOptions, PipelineArtifactContext, PipelineResult } from "../types";

const defaultArtifacts = Object.freeze({}) as Record<string, unknown>;

export const executeFormPipeline = async <
  TArtifacts extends Record<string, unknown> = Record<string, never>,
>({
  form,
  submit,
  artifactAdapter,
  reportFetchMode = "all",
}: ExecuteFormPipelineOptions<TArtifacts>): Promise<PipelineResult<TArtifacts>> => {
  const submitResult = await form.submit(submit);
  const reportFetchState =
    reportFetchMode === "all"
      ? await executeReportFetches({
          reports: form.reports,
          request: createReportFetchRequest(submitResult, { signal: submit?.signal }),
        })
      : { results: {}, errors: {} };

  const artifactContext: PipelineArtifactContext = {
    submitResult,
    reportFetchResults: reportFetchState.results,
    reportFetchErrors: reportFetchState.errors,
  };

  const artifacts = artifactAdapter
    ? await artifactAdapter.derive(artifactContext)
    : (defaultArtifacts as TArtifacts);

  return {
    submitResult,
    reportFetchResults: reportFetchState.results,
    reportFetchErrors: reportFetchState.errors,
    artifacts,
  };
};
