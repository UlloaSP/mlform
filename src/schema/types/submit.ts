// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { MappedTo } from "../mapped-to";

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
  reports: readonly unknown[];
  meta: Record<string, unknown>;
  raw: unknown;
}

export interface SubmitResult<TReportState = unknown> {
  backend?: string;
  inputs?: SubmissionInputRecord[];
  displayValues?: Record<string, unknown>;
  modelValues?: Record<string, unknown>;
  values: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  serializedFieldValues: Record<string, unknown>;
  reports: readonly unknown[];
  reportContexts?: Record<string, ReportContext>;
  reportStates: Record<string, TReportState>;
  meta: Record<string, unknown>;
  raw: unknown;
}
