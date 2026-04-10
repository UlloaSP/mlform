// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { NormalizedFieldConfig } from "./field";
import type { NormalizedReportConfig, ReportStateSnapshot } from "./report";

export interface SubmitRequest {
  backend?: string;
  values: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  serializedFieldValues: Record<string, unknown>;
  fields: readonly NormalizedFieldConfig[];
  reports: readonly NormalizedReportConfig[];
  signal?: AbortSignal;
}

export interface TransportResponse {
  reports?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  raw?: unknown;
}

export interface SubmitResult {
  backend?: string;
  values: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  serializedFieldValues: Record<string, unknown>;
  reports: Record<string, unknown>;
  reportStates: Record<string, ReportStateSnapshot>;
  meta: Record<string, unknown>;
  raw: unknown;
}

export interface Transport {
  submit: (request: SubmitRequest) => Promise<unknown>;
}

export interface SingleTransportConfig {
  transport: Transport;
  transports?: never;
  defaultBackend?: never;
}

export interface MultiTransportConfig {
  transport?: never;
  transports: Record<string, Transport>;
  defaultBackend?: string;
}

export type FormTransportConfig = SingleTransportConfig | MultiTransportConfig;

export interface SubmitOptions {
  signal?: AbortSignal;
  backend?: string;
}

export interface BeforeSubmitContext {
  backend?: string;
  values: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  serializedFieldValues: Record<string, unknown>;
  submitCount: number;
  signal: AbortSignal;
}

export interface AfterSubmitContext {
  backend?: string;
  values: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  serializedFieldValues: Record<string, unknown>;
  submitCount: number;
  result: SubmitResult;
}

export interface SubmitErrorContext {
  backend?: string;
  values: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  serializedFieldValues: Record<string, unknown>;
  submitCount: number;
  error: unknown;
}
