// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ReportResult, SubmissionInputRecord } from "@/schema";

export interface SubmitRequest<
  TField extends Record<string, unknown> = Record<string, unknown>,
  TReport extends Record<string, unknown> = Record<string, unknown>,
> {
  backend?: string;
  inputs: SubmissionInputRecord[];
  displayValues: Record<string, unknown>;
  modelValues: Record<string, unknown>;
  fields: readonly TField[];
  reports: readonly TReport[];
  signal?: AbortSignal;
}

export interface TransportResponse {
  reports?: readonly ReportResult[];
  meta?: Record<string, unknown>;
  raw?: unknown;
}

export interface Transport<
  TField extends Record<string, unknown> = Record<string, unknown>,
  TReport extends Record<string, unknown> = Record<string, unknown>,
> {
  submit: (request: SubmitRequest<TField, TReport>) => Promise<unknown>;
}
