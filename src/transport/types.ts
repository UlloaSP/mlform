// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ReadonlySubmissionInputRecord, ReportResult } from "@/schema";

export interface SubmitRequest<
  TField extends Record<string, unknown> = Record<string, unknown>,
  TReport extends Record<string, unknown> = Record<string, unknown>,
> {
  readonly backend?: string;
  readonly inputs: readonly ReadonlySubmissionInputRecord[];
  readonly displayValues: Readonly<Record<string, unknown>>;
  readonly modelValues: Readonly<Record<string, unknown>>;
  readonly fields: readonly TField[];
  readonly reports: readonly TReport[];
  readonly signal?: AbortSignal;
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
