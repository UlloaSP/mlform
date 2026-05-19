// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { NormalizedReportConfig, ReportConfig, ReportDefinition } from "@/schema";
import type {
  DeclarativeReportKind,
  ReportDescriptor,
  ReportDescriptorContext,
  ReportPresenter,
} from "./index";
import { toPresentationNodes } from "./types/presentation";

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
  presenter: ReportPresenter<TConfig>;
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

  const presenter: ReportPresenter<TConfig> = {
    kind: kind.kind,
    describe(config, context) {
      if (
        context.payload === undefined &&
        context.state.error === null &&
        context.result === null
      ) {
        return null;
      }

      const renderContext = {
        config,
        report: config,
        reportId: config.id,
        state: context.state,
        payload: context.payload as TPayload,
        result: context.result,
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
              : toPresentationNodes(kind.render.content(renderContext)),
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
