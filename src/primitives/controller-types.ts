// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export type PrimitiveFormLifecycle = "active" | "suspended" | "disposed";
export type PrimitiveFormOperation = "idle" | "validating" | "submitting";
export type PrimitiveSubmissionStatus = "idle" | "succeeded" | "failed" | "aborted";
export type PrimitiveFormTransitionType =
  | "validation-started"
  | "validation-finished"
  | "validation-failed"
  | "submission-started"
  | "submission-succeeded"
  | "submission-failed"
  | "submission-aborted"
  | "reset"
  | "restored"
  | "suspended"
  | "resumed"
  | "disposed";

export interface PrimitiveFormTransitionState {
  lifecycle: PrimitiveFormLifecycle;
  operation: PrimitiveFormOperation;
  submissionStatus: PrimitiveSubmissionStatus;
  submitCount: number;
}

export interface PrimitiveFormTransition {
  sequence: number;
  type: PrimitiveFormTransitionType;
  from: PrimitiveFormTransitionState;
  to: PrimitiveFormTransitionState;
  reason?: string;
}

export type PrimitiveReportStatus = "idle" | "loading" | "ready" | "skipped" | "error";

export interface PrimitiveFieldStateSnapshot {
  value: unknown;
  errors: readonly string[];
  status: string;
  visible: boolean;
  valid: boolean;
  touched: boolean;
  dirty: boolean;
  disabled: boolean;
  readOnly: boolean;
}

export interface PrimitiveReportStateSnapshot {
  payload: unknown;
  error: string | null;
  status: PrimitiveReportStatus;
}

export interface PrimitiveSubmitResult {
  backend?: string;
  inputs: PrimitiveSubmissionInputRecord[];
  displayValues: Record<string, unknown>;
  modelValues: Record<string, unknown>;
  reports: readonly unknown[];
  reportContexts: Record<string, PrimitiveReportContext>;
  reportStates: Record<string, unknown>;
  meta: Record<string, unknown>;
  raw: unknown;
}

export interface PrimitivePipelineResult {
  submitResult: PrimitiveSubmitResult;
  reportFetchResults: Record<string, unknown>;
  reportFetchErrors: Record<string, string>;
  artifacts: Record<string, unknown>;
}

export interface PrimitiveSubmissionInputRecord {
  fieldId: string;
  displayKey?: string;
  label: string;
  value: unknown;
  serializedValue: unknown;
  mappedTo?: string | number;
  modelValues: Record<string, unknown>;
  visible: boolean;
  disabled: boolean;
}

export interface PrimitiveReportContext {
  reportId: string;
  kind: string;
  label?: string;
  mappedTo?: unknown;
  target?: string | number;
  targetKey?: string;
  backend?: string;
  displayValues: Record<string, unknown>;
  modelValues: Record<string, unknown>;
  reports: readonly unknown[];
  meta: Record<string, unknown>;
  raw: unknown;
}

export interface PrimitiveFormState {
  lifecycle: PrimitiveFormLifecycle;
  operation: PrimitiveFormOperation;
  submissionStatus: PrimitiveSubmissionStatus;
  submitCount: number;
  errors: { form: readonly string[] };
  lastResult: PrimitiveSubmitResult | null;
}

export interface PrimitiveFieldController {
  id: string;
  kind: string;
  config: { label?: string; defaultValue?: unknown; [key: string]: unknown };
  state: PrimitiveFieldStateSnapshot;
  setValue(value: unknown): void;
  blur(): void;
  validate(): Promise<unknown>;
  subscribe(listener: () => void): () => void;
}

export interface PrimitiveReportController {
  id: string;
  kind: string;
  config: { label?: string; [key: string]: unknown };
  state: PrimitiveReportStateSnapshot;
  canFetch?: boolean;
  fetch(request: PrimitiveReportRequest): Promise<unknown>;
  subscribe(listener: () => void): () => void;
}

export interface PrimitiveFormController {
  state: PrimitiveFormState;
  fields: readonly PrimitiveFieldController[];
  reports: readonly PrimitiveReportController[];
  getField(id: string): PrimitiveFieldController | undefined;
  getReport(id: string): PrimitiveReportController | undefined;
  submit(): Promise<PrimitiveSubmitResult>;
  subscribeTransitions(listener: (transition: PrimitiveFormTransition) => void): () => void;
  subscribeSelector<T>(
    selector: (state: PrimitiveFormState) => T,
    listener: (value: T) => void,
    options?: { equality?: (left: T, right: T) => boolean },
  ): () => void;
}

export interface PrimitiveSubmitExecutionResult {
  result: PrimitiveSubmitResult;
  pipelineResult?: PrimitivePipelineResult;
}

export interface PrimitiveReportRequest {
  reportId: string;
  backend?: string;
  inputs: PrimitiveSubmissionInputRecord[];
  displayValues: Record<string, unknown>;
  modelValues: Record<string, unknown>;
  reports: readonly unknown[];
  reportContext?: PrimitiveReportContext;
  reportContexts: Record<string, PrimitiveReportContext>;
  meta: Record<string, unknown>;
  raw: unknown;
  signal?: AbortSignal;
}

export const createPrimitiveReportRequest = (
  submitResult: PrimitiveSubmitResult,
  options: { reportId?: string; signal?: AbortSignal } = {},
): PrimitiveReportRequest => ({
  reportId: options.reportId ?? "",
  backend: submitResult.backend,
  inputs: submitResult.inputs,
  displayValues: submitResult.displayValues,
  modelValues: submitResult.modelValues,
  reports: submitResult.reports,
  reportContext:
    options.reportId === undefined ? undefined : submitResult.reportContexts?.[options.reportId],
  reportContexts: submitResult.reportContexts,
  meta: submitResult.meta,
  raw: submitResult.raw,
  signal: options.signal,
});
