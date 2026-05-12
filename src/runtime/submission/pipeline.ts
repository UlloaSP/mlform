// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { executeExplanations } from "./explanations";
import type {
  ExecuteFormPipelineOptions,
  ExplanationFetchRequest,
  PipelineArtifactContext,
  PipelineResult,
} from "../types";

const defaultArtifacts = Object.freeze({}) as Record<string, unknown>;

const createExplanationFetchRequest = (
  submitResult: PipelineArtifactContext["submitResult"],
  signal: AbortSignal | undefined,
): ExplanationFetchRequest => ({
  explanationId: "",
  backend: submitResult.backend,
  values: submitResult.values,
  fieldValues: submitResult.fieldValues,
  serializedValues: submitResult.serializedValues,
  serializedFieldValues: submitResult.serializedFieldValues,
  reports: submitResult.reports,
  meta: submitResult.meta,
  raw: submitResult.raw,
  signal,
});

export const executeFormPipeline = async <
  TArtifacts extends Record<string, unknown> = Record<string, never>,
>({
  form,
  submit,
  artifactAdapter,
  explanationMode = "all",
}: ExecuteFormPipelineOptions<TArtifacts>): Promise<PipelineResult<TArtifacts>> => {
  const submitResult = await form.submit(submit);
  const explanationState =
    explanationMode === "all"
      ? await executeExplanations({
          explanations: form.explanations,
          request: createExplanationFetchRequest(submitResult, submit?.signal),
        })
      : { results: {}, errors: {} };

  const artifactContext: PipelineArtifactContext = {
    submitResult,
    explanationResults: explanationState.results,
    explanationErrors: explanationState.errors,
  };

  const artifacts = artifactAdapter
    ? await artifactAdapter.derive(artifactContext)
    : (defaultArtifacts as TArtifacts);

  return {
    submitResult,
    explanationResults: explanationState.results,
    explanationErrors: explanationState.errors,
    artifacts,
  };
};
