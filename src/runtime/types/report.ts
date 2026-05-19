// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export type {
  BaseReportConfig,
  PartialReportUpdatePolicy,
  ReportConfig,
  ReportFetchContext,
  ReportFetchFactory,
  ReportFetchRequest,
  ReportFetchStatus,
  ReportFetchTransport,
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

export interface ReportHandle {
  readonly id: string;
  readonly kind: string;
  readonly config: SchemaNormalizedReportConfig;
  readonly state: ReportStateSnapshot;
  readonly canFetch: boolean;
  fetch(request: import("@/schema").ReportFetchRequest): Promise<void>;
  abort(): void;
  subscribe(listener: (state: ReportStateSnapshot) => void): () => void;
}

export type ReportController = ReportHandle;
export type ReportDefinition<
  TConfig extends import("@/schema").ReportConfig = import("@/schema").ReportConfig,
> = SchemaReportDefinition<TConfig>;

export type NormalizedReportConfig<
  TConfig extends import("@/schema").ReportConfig = import("@/schema").ReportConfig,
> = SchemaNormalizedReportConfig<TConfig>;
export type RuntimeReportDefinition = ReportDefinition;
