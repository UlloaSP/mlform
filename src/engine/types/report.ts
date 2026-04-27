// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ZodType } from "zod";
import type { PresentationContent, PresentationSummary } from "../declarative/presentation";
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

export interface ReportResolveContext<TConfig extends ReportConfig = ReportConfig> {
  config: NormalizedReportConfig<TConfig>;
  report: NormalizedReportConfig<TConfig>;
  result: SubmitResult;
}

export interface ReportRenderSpecContext<
  TConfig extends ReportConfig = ReportConfig,
  TPayload = unknown,
> {
  config: NormalizedReportConfig<TConfig>;
  report: NormalizedReportConfig<TConfig>;
  reportId: string;
  state: ReportStateSnapshot;
  payload: TPayload;
  result: SubmitResult | null;
}

export interface ReportRenderSpec<TConfig extends ReportConfig = ReportConfig, TPayload = unknown> {
  summary?: (
    context: ReportRenderSpecContext<TConfig, TPayload>,
  ) => PresentationSummary | undefined;
  content: (context: ReportRenderSpecContext<TConfig, TPayload>) => PresentationContent;
}

export interface DeclarativeReportKind<
  TConfig extends ReportConfig = ReportConfig,
  TPayload = unknown,
> {
  kind: string;
  schema: ZodType<TConfig>;
  payloadSchema?: ZodType<unknown>;
  payloadValidationPolicy?: ReportPayloadValidationPolicy;
  partialUpdatePolicy?: PartialReportUpdatePolicy;
  clonePayload?: (payload: TPayload, config: TConfig) => TPayload;
  resolve: (context: ReportResolveContext<TConfig>) => MaybePromise<TPayload>;
  render: ReportRenderSpec<TConfig, TPayload>;
}
export type ReportPayloadValidationPolicy = "report-error" | "fail-submit";
export type PartialReportUpdatePolicy = "trust" | "validate" | "defer";

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
