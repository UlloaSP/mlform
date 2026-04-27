// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ExplanationController, ExplanationFetchRequest } from "./explanation";
import type { FormController } from "./form";
import type { SubmitOptions, SubmitResult } from "./transport";

export interface ExplanationExecutionResult {
  results: Record<string, unknown>;
  errors: Record<string, string>;
}

export interface PipelineArtifactContext {
  submitResult: SubmitResult;
  explanationResults: Record<string, unknown>;
  explanationErrors: Record<string, string>;
}

export interface PipelineArtifactAdapter<TArtifacts extends Record<string, unknown> = {}> {
  derive(context: PipelineArtifactContext): TArtifacts | Promise<TArtifacts>;
}

export interface ExecuteFormPipelineOptions<TArtifacts extends Record<string, unknown> = {}> {
  form: FormController;
  submit?: SubmitOptions;
  artifactAdapter?: PipelineArtifactAdapter<TArtifacts>;
  explanationMode?: "none" | "all";
}

export interface PipelineResult<TArtifacts extends Record<string, unknown> = {}> {
  submitResult: SubmitResult;
  explanationResults: Record<string, unknown>;
  explanationErrors: Record<string, string>;
  artifacts: TArtifacts;
}

export interface ExplanationExecutionContext {
  explanations: readonly ExplanationController[];
  request: ExplanationFetchRequest;
}
