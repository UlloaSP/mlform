// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ZodType } from "zod";
import type { SubmitResult } from "./transport";

type MaybePromise<T> = T | PromiseLike<T>;

export type ReportStatus = "idle" | "loading" | "ready" | "error";

export interface ReportDescriptor {
  component: string;
  props: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

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

export interface ReportDescriptorContext {
  reportId: string;
  state: ReportStateSnapshot;
  payload: unknown;
  result: SubmitResult | null;
}

export interface ReportPayloadContext<TConfig extends ReportConfig = ReportConfig> {
  report: NormalizedReportConfig<TConfig>;
  result: SubmitResult;
}

export type ReportPayloadValidationPolicy = "report-error" | "fail-submit";

export interface ReportDefinition<TConfig extends ReportConfig = ReportConfig> {
  kind: string;
  schema: ZodType<TConfig>;
  payloadSchema?: ZodType<unknown>;
  payloadValidationPolicy?: ReportPayloadValidationPolicy;
  clonePayload?: (payload: unknown, config: TConfig) => unknown;
  resolvePayload?: (
    config: TConfig,
    context: ReportPayloadContext<TConfig>,
  ) => MaybePromise<unknown>;
  describe: (config: TConfig, context: ReportDescriptorContext) => ReportDescriptor | null;
}

export interface ReportController {
  readonly id: string;
  readonly kind: string;
  readonly config: NormalizedReportConfig;
  readonly state: ReportStateSnapshot;
  readonly descriptor: ReportDescriptor | null;
  subscribe(listener: (state: ReportStateSnapshot) => void): () => void;
}
