// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { SubmitRequest as BaseSubmitRequest, Transport as BaseTransport } from "@/transport";
import type { SubmissionInputRecord, SubmitResult as SchemaSubmitResult } from "@/schema";
import type { NormalizedFieldConfig } from "./field";
import type { NormalizedReportConfig, ReportStateSnapshot } from "./report";

export type { SubmissionInputRecord } from "@/schema";
export type { ReportContext, ReportResult, ReportResultContext } from "@/schema";
export type { TransportResponse } from "@/transport";

export type SubmitRequest = BaseSubmitRequest<NormalizedFieldConfig, NormalizedReportConfig>;

export type SubmitResult = SchemaSubmitResult<ReportStateSnapshot>;

export type Transport = BaseTransport<NormalizedFieldConfig, NormalizedReportConfig>;

export interface SubmitOptions {
  signal?: AbortSignal;
  backend?: string;
}

export interface BeforeSubmitContext {
  backend?: string;
  inputs: SubmissionInputRecord[];
  displayValues: Record<string, unknown>;
  modelValues: Record<string, unknown>;
  values: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  serializedFieldValues: Record<string, unknown>;
  submitCount: number;
  signal: AbortSignal;
}

export interface AfterSubmitContext {
  backend?: string;
  inputs: SubmissionInputRecord[];
  displayValues: Record<string, unknown>;
  modelValues: Record<string, unknown>;
  values: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  serializedFieldValues: Record<string, unknown>;
  submitCount: number;
  result: SubmitResult;
}

export interface SubmitErrorContext {
  backend?: string;
  inputs: SubmissionInputRecord[];
  displayValues: Record<string, unknown>;
  modelValues: Record<string, unknown>;
  values: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  serializedFieldValues: Record<string, unknown>;
  submitCount: number;
  error: unknown;
}
