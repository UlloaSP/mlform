// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export type {
  BaseReportConfig,
  PartialReportUpdatePolicy,
  ReportConfig,
  ReportPayloadContext,
  ReportPayloadValidationPolicy,
  ReportResolveContext,
  ReportStateSnapshot,
  ReportStatus,
} from "@/schema";

import type {
  NormalizedReportConfig as SchemaNormalizedReportConfig,
  ReportDefinition as SchemaReportDefinition,
  ReportStateSnapshot,
} from "@/schema";
import type { ReportDescriptor } from "@/presentation";
import type { SubmitResult } from "./transport";

export interface ReportHandle {
  readonly id: string;
  readonly kind: string;
  readonly config: SchemaNormalizedReportConfig;
  readonly state: ReportStateSnapshot;
  subscribe(listener: (state: ReportStateSnapshot) => void): () => void;
}

export type ReportController = ReportHandle;
export type ReportDefinition<
  TConfig extends import("@/schema").ReportConfig = import("@/schema").ReportConfig,
> = SchemaReportDefinition<TConfig> & {
  describe?: (
    config: SchemaNormalizedReportConfig<TConfig>,
    context: {
      reportId: string;
      state: ReportStateSnapshot;
      payload: unknown;
      result: SubmitResult | null;
    },
  ) => ReportDescriptor | null;
  [key: string]: unknown;
};

export type NormalizedReportConfig<
  TConfig extends import("@/schema").ReportConfig = import("@/schema").ReportConfig,
> = SchemaNormalizedReportConfig<TConfig>;
export type RuntimeReportDefinition = ReportDefinition;
