// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  NormalizedReportConfig,
  ReportConfig,
  ReportDefinition,
  ReportFetchFactory,
  ReportResolveContext,
  ReportStateSnapshot,
  SubmitResult,
} from "@/schema";
import type {
  ReportDescriptor,
  ReportDescriptorContext,
  ReportPresenter,
  DescriptorContent,
  DescriptorSummary,
} from "@/primitives";
import { toDescriptorNodes } from "@/primitives";
import type { ZodType } from "zod";

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
  summary?: (context: ReportRenderSpecContext<TConfig, TPayload>) => DescriptorSummary | undefined;
  content: (context: ReportRenderSpecContext<TConfig, TPayload>) => DescriptorContent;
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
  fetch?: ReportFetchFactory<TConfig>;
  resolve: (context: ReportResolveContext<TConfig>) => unknown;
  render: ReportRenderSpec<TConfig, TPayload>;
}

export type DefinedReportKind<TConfig extends ReportConfig, _TPayload> = {
  kind: string;
  schema: import("zod").ZodType<TConfig>;
  payloadSchema?: ReportDefinition<TConfig>["payloadSchema"];
  payloadValidationPolicy?: ReportDefinition<TConfig>["payloadValidationPolicy"];
  partialUpdatePolicy?: ReportDefinition<TConfig>["partialUpdatePolicy"];
  clonePayload?: ReportDefinition<TConfig>["clonePayload"];
  fetch?: ReportDefinition<TConfig>["fetch"];
  resolvePayload?: ReportDefinition<TConfig>["resolvePayload"];
  describe?: (
    config: NormalizedReportConfig<TConfig>,
    context: ReportDescriptorContext,
  ) => ReportDescriptor | null;
  definition: ReportDefinition<TConfig>;
  presenter: ReportPresenter<NormalizedReportConfig<TConfig>>;
};

export const defineReportKind = <TConfig extends ReportConfig, TPayload>(
  kind: DeclarativeReportKind<TConfig, TPayload>,
): DefinedReportKind<TConfig, TPayload> => {
  const definition: ReportDefinition<TConfig> = {
    kind: kind.kind,
    schema: kind.schema,
    payloadSchema: kind.payloadSchema,
    payloadValidationPolicy: kind.payloadValidationPolicy,
    partialUpdatePolicy: kind.partialUpdatePolicy,
    clonePayload: kind.clonePayload as ((payload: unknown, config: TConfig) => unknown) | undefined,
    fetch: kind.fetch,
    resolvePayload: (_config, context) =>
      kind.resolve({
        config: context.report,
        report: context.report,
        result: context.result,
      }),
  };

  const presenter: ReportPresenter<NormalizedReportConfig<TConfig>> = {
    kind: kind.kind,
    describe(config, context) {
      if (
        context.payload === undefined &&
        context.state.error === null &&
        context.result === null
      ) {
        return null;
      }

      const renderContext: ReportRenderSpecContext<TConfig, TPayload> = {
        config,
        report: config,
        reportId: config.id,
        state: context.state as ReportStateSnapshot,
        payload: context.payload as TPayload,
        result: context.result as SubmitResult | null,
      };

      return {
        component: "declarative-report",
        props: {
          id: config.id,
          kind: config.kind,
          label: config.label ?? config.id,
          description: config.description ?? "",
          payload: context.payload,
          error: context.state.error,
          state: context.state.status,
          summary: kind.render.summary?.(renderContext) ?? null,
          content:
            context.payload === undefined
              ? []
              : toDescriptorNodes(kind.render.content(renderContext)),
          ...config.ui,
        },
        meta: {
          declarative: true,
        },
      };
    },
  };

  const describe = presenter.describe.bind(presenter);

  Object.assign(definition as unknown as Record<string, unknown>, {
    describe,
  });

  return {
    kind: kind.kind,
    schema: kind.schema,
    payloadSchema: kind.payloadSchema,
    payloadValidationPolicy: kind.payloadValidationPolicy,
    partialUpdatePolicy: kind.partialUpdatePolicy,
    clonePayload: definition.clonePayload,
    fetch: definition.fetch,
    resolvePayload: definition.resolvePayload,
    describe,
    definition,
    presenter,
  };
};
