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

export type TransportStreamEvent =
  | {
      type: "progress";
      loaded?: number;
      total?: number;
      message?: string;
      meta?: Record<string, unknown>;
    }
  | { type: "meta"; meta: Record<string, unknown> }
  | { type: "chunk"; chunk: unknown; meta?: Record<string, unknown> }
  | { type: "report-replace"; reportId: string; payload: unknown; meta?: Record<string, unknown> }
  | {
      type: "report-patch";
      reportId: string;
      patch: unknown;
      strategy?: "replace" | "shallow-merge" | "deep-merge";
      meta?: Record<string, unknown>;
    }
  | {
      type: "field-update";
      fieldId: string;
      value?: unknown;
      errors?: string[];
      touched?: boolean;
      dirty?: boolean;
      status?: string;
      meta?: Record<string, unknown>;
    }
  | { type: "result"; result: unknown; meta?: Record<string, unknown> }
  | { type: "error"; error: unknown; meta?: Record<string, unknown> };

export interface Transport<
  TField extends Record<string, unknown> = Record<string, unknown>,
  TReport extends Record<string, unknown> = Record<string, unknown>,
> {
  submit: (request: SubmitRequest<TField, TReport>) => Promise<unknown>;
  stream?: (
    request: SubmitRequest<TField, TReport>,
  ) => AsyncIterable<TransportStreamEvent> | PromiseLike<AsyncIterable<TransportStreamEvent>>;
}
