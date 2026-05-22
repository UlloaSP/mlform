// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FormController } from "./form";
import type { ReportController, ReportFetchRequest } from "./report";
import type { SubmitOptions, SubmitResult } from "./transport";

export interface ReportFetchExecutionResult {
  results: Record<string, unknown>;
  errors: Record<string, string>;
}

export interface PipelineArtifactContext {
  submitResult: SubmitResult;
  reportFetchResults: Record<string, unknown>;
  reportFetchErrors: Record<string, string>;
}

export interface PipelineArtifactAdapter<TArtifacts extends Record<string, unknown> = {}> {
  derive(context: PipelineArtifactContext): TArtifacts | Promise<TArtifacts>;
}

export interface ExecuteFormPipelineOptions<TArtifacts extends Record<string, unknown> = {}> {
  form: FormController;
  submit?: SubmitOptions;
  artifactAdapter?: PipelineArtifactAdapter<TArtifacts>;
  reportFetchMode?: "none" | "all";
}

export interface PipelineResult<TArtifacts extends Record<string, unknown> = {}> {
  submitResult: SubmitResult;
  reportFetchResults: Record<string, unknown>;
  reportFetchErrors: Record<string, string>;
  artifacts: TArtifacts;
}

export interface ReportFetchExecutionContext {
  reports: readonly ReportController[];
  request: ReportFetchRequest;
}
