// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ZodType } from "zod";
import type { MaybePromise } from "./field";
import type { SubmitResult } from "@/runtime/types/transport";

export type ReportStatus = "idle" | "loading" | "ready" | "error";
export type ReportPayloadValidationPolicy = "report-error" | "fail-submit";
export type PartialReportUpdatePolicy = "trust" | "validate" | "defer";

export interface BaseReportConfig {
  id?: string;
  kind: string;
  label?: string;
  description?: string;
  source?: string;
  ui?: Record<string, unknown>;
  [key: string]: unknown;
}

export type ReportConfig = BaseReportConfig;

export type NormalizedReportConfig<TConfig extends ReportConfig = ReportConfig> = TConfig & {
  id: string;
  source: string;
};

export interface ReportStateSnapshot {
  payload: unknown;
  error: string | null;
  status: ReportStatus;
}

export interface ReportPayloadContext<TConfig extends ReportConfig = ReportConfig> {
  report: NormalizedReportConfig<TConfig>;
  result: SubmitResult;
}

export interface ReportResolveContext<TConfig extends ReportConfig = ReportConfig> {
  config: NormalizedReportConfig<TConfig>;
  report: NormalizedReportConfig<TConfig>;
  result: SubmitResult;
}

export interface ReportDefinition<TConfig extends ReportConfig = ReportConfig> {
  kind: string;
  schema: ZodType<TConfig>;
  payloadSchema?: ZodType<unknown>;
  payloadValidationPolicy?: ReportPayloadValidationPolicy;
  partialUpdatePolicy?: PartialReportUpdatePolicy;
  clonePayload?: (payload: unknown, config: TConfig) => unknown;
  resolvePayload?: (
    config: TConfig,
    context: ReportPayloadContext<TConfig>,
  ) => MaybePromise<unknown>;
}
