// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export type PrimitiveFormStatus =
  | "idle"
  | "editing"
  | "validating"
  | "submitting"
  | "success"
  | "error";

export type PrimitiveReportStatus = "idle" | "loading" | "ready" | "error";

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
  values: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  serializedFieldValues: Record<string, unknown>;
  reports: Record<string, unknown>;
  reportStates: Record<string, unknown>;
  meta: Record<string, unknown>;
  raw: unknown;
}

export interface PrimitiveFormState {
  status: PrimitiveFormStatus;
  submitCount: number;
  errors: { form: readonly string[] };
  lastResult: PrimitiveSubmitResult | null;
  submissionProgress?: {
    loaded?: number;
    total?: number;
    message?: string;
    sessionMessageCount?: number;
  } | null;
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
  subscribeSelector<T>(
    selector: (state: PrimitiveFormState) => T,
    listener: (value: T) => void,
    options?: { equality?: (left: T, right: T) => boolean },
  ): () => void;
}

export interface PrimitiveReportRequest {
  reportId: string;
  backend?: string;
  values: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  serializedFieldValues: Record<string, unknown>;
  reports: Record<string, unknown>;
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
  values: submitResult.values,
  fieldValues: submitResult.fieldValues,
  serializedValues: submitResult.serializedValues,
  serializedFieldValues: submitResult.serializedFieldValues,
  reports: submitResult.reports,
  meta: submitResult.meta,
  raw: submitResult.raw,
  signal: options.signal,
});
