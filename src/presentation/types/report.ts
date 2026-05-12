// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  NormalizedReportConfig,
  ReportConfig,
  ReportResolveContext,
  ReportStateSnapshot,
} from "@/schema";
import type { SubmitResult } from "@/runtime/types/transport";
import type { ZodType } from "zod";
import type { PresentationContent, PresentationSummary } from "./presentation";

export interface ReportDescriptor {
  component: string;
  props: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface ReportDescriptorContext {
  reportId: string;
  state: ReportStateSnapshot;
  payload: unknown;
  result: SubmitResult | null;
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
  payloadValidationPolicy?: "report-error" | "fail-submit";
  partialUpdatePolicy?: "trust" | "validate" | "defer";
  clonePayload?: (payload: TPayload, config: TConfig) => TPayload;
  resolve: (context: ReportResolveContext<TConfig>) => unknown;
  render: ReportRenderSpec<TConfig, TPayload>;
}

export interface ReportPresenter<TConfig extends ReportConfig = ReportConfig> {
  kind: string;
  describe(
    config: NormalizedReportConfig<TConfig>,
    context: ReportDescriptorContext,
  ): ReportDescriptor | null;
}
