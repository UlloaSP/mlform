// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { MappedTo } from "../mapped-to";
import type { MappedToTarget } from "../mapped-to";

export interface SubmissionInputRecord {
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

export interface ReportContext {
  reportId: string;
  kind: string;
  label?: string;
  mappedTo?: MappedTo;
  target?: string | number;
  targetKey?: string;
  backend?: string;
  displayValues: Record<string, unknown>;
  modelValues: Record<string, unknown>;
  reports: readonly ReportResult[];
  meta: Record<string, unknown>;
  raw: unknown;
}

export interface ReportResultContext {
  displayValues?: Record<string, unknown>;
  modelValues?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  raw?: unknown;
}

interface BaseReportResult {
  backend: string;
  mappedTo: MappedToTarget;
  context?: ReportResultContext;
}

export type ReportResult =
  | (BaseReportResult & { status: "pending" })
  | (BaseReportResult & { status: "ready"; payload: unknown })
  | (BaseReportResult & { status: "skipped"; reason?: string });

export interface SubmitResult<TReportState = unknown> {
  backend?: string;
  inputs?: SubmissionInputRecord[];
  displayValues?: Record<string, unknown>;
  modelValues?: Record<string, unknown>;
  values: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  serializedFieldValues: Record<string, unknown>;
  reports: readonly ReportResult[];
  reportContexts?: Record<string, ReportContext>;
  reportStates: Record<string, TReportState>;
  meta: Record<string, unknown>;
  raw: unknown;
}
