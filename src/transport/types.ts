// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { SubmissionInputRecord } from "@/schema";

export interface SubmitRequest<
  TField extends Record<string, unknown> = Record<string, unknown>,
  TReport extends Record<string, unknown> = Record<string, unknown>,
> {
  backend?: string;
  inputs?: SubmissionInputRecord[];
  displayValues?: Record<string, unknown>;
  modelValues?: Record<string, unknown>;
  values: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  serializedFieldValues: Record<string, unknown>;
  fields: readonly TField[];
  reports: readonly TReport[];
  signal?: AbortSignal;
}

export interface TransportResponse {
  reports?: readonly unknown[];
  meta?: Record<string, unknown>;
  raw?: unknown;
}

export interface Transport<
  TField extends Record<string, unknown> = Record<string, unknown>,
  TReport extends Record<string, unknown> = Record<string, unknown>,
> {
  submit: (request: SubmitRequest<TField, TReport>) => Promise<unknown>;
}
