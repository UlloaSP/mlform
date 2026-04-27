// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { TransportCapabilities } from "./capabilities";
import type { TransportStreamEvent } from "./events";
import type { TransportSession } from "./session";

export type MaybePromise<T> = T | PromiseLike<T>;

export interface TransportPolicyContext {
  scope: string;
  source?: string;
  backend?: string;
  requestId?: string;
}

export interface SubmitRequestTransportContext {
  headers?: HeadersInit;
  credentials?: RequestCredentials;
  attributes?: Record<string, unknown>;
  policy?: TransportPolicyContext;
}

export interface SubmitRequestMetadata {
  estimatedPayloadBytes?: number;
}

export interface SubmitRequest<
  TField extends Record<string, unknown> = Record<string, unknown>,
  TReport extends Record<string, unknown> = Record<string, unknown>,
> {
  backend?: string;
  values: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  serializedFieldValues: Record<string, unknown>;
  fields: readonly TField[];
  reports: readonly TReport[];
  transport?: SubmitRequestTransportContext;
  metadata?: SubmitRequestMetadata;
  signal?: AbortSignal;
}

export interface TransportResponse {
  reports?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  raw?: unknown;
}

export interface SubmitResult<
  TReportState extends Record<string, unknown> = Record<string, unknown>,
> {
  backend?: string;
  values: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  serializedFieldValues: Record<string, unknown>;
  reports: Record<string, unknown>;
  reportStates: Record<string, TReportState>;
  meta: Record<string, unknown>;
  raw: unknown;
}

export interface Transport<
  TField extends Record<string, unknown> = Record<string, unknown>,
  TReport extends Record<string, unknown> = Record<string, unknown>,
> {
  submit: (request: SubmitRequest<TField, TReport>) => Promise<unknown>;
  stream?: (
    request: SubmitRequest<TField, TReport>,
  ) => AsyncIterable<TransportStreamEvent> | PromiseLike<AsyncIterable<TransportStreamEvent>>;
  openSession?: (request: SubmitRequest<TField, TReport>) => MaybePromise<TransportSession>;
  capabilities?: TransportCapabilities;
}

export interface SubmitOptions {
  signal?: AbortSignal;
  backend?: string;
}
