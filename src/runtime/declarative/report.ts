// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { toPresentationNodes } from "./presentation";
import type {
  DeclarativeReportKind,
  NormalizedReportConfig,
  ReportConfig,
  ReportDefinition,
  ReportDescriptor,
  ReportRenderSpecContext,
  ReportStateSnapshot,
  SubmitResult,
} from "../types";

const declarativeReportComponent = "declarative-report";

const createDescriptor = <TConfig extends ReportConfig, TPayload>(
  config: NormalizedReportConfig<TConfig>,
  state: ReportStateSnapshot,
  payload: TPayload,
  result: SubmitResult | null,
  kind: DeclarativeReportKind<TConfig, TPayload>,
): ReportDescriptor => {
  const renderContext: ReportRenderSpecContext<TConfig, TPayload> = {
    config,
    report: config,
    reportId: config.id,
    state,
    payload,
    result,
  };

  return {
    component: declarativeReportComponent,
    props: {
      id: config.id,
      kind: config.kind,
      label: config.label ?? config.id,
      description: config.description ?? "",
      payload,
      error: state.error,
      state: state.status,
      summary: kind.render.summary?.(renderContext) ?? null,
      content: toPresentationNodes(kind.render.content(renderContext)),
      ...config.ui,
    },
    meta: {
      declarative: true,
    },
  };
};

export const defineReportKind = <TConfig extends ReportConfig, TPayload>(
  kind: DeclarativeReportKind<TConfig, TPayload>,
): ReportDefinition<TConfig> => {
  return {
    kind: kind.kind,
    schema: kind.schema,
    payloadSchema: kind.payloadSchema,
    payloadValidationPolicy: kind.payloadValidationPolicy,
    partialUpdatePolicy: kind.partialUpdatePolicy,
    clonePayload: kind.clonePayload as ((payload: unknown, config: TConfig) => unknown) | undefined,
    resolvePayload: (_config, context) =>
      kind.resolve({
        config: context.report,
        report: context.report,
        result: context.result,
      }),
    describe: (config, context) => {
      const normalizedConfig = config as NormalizedReportConfig<TConfig>;
      if (context.state.status === "idle" && context.payload === undefined) {
        return null;
      }

      return createDescriptor(
        normalizedConfig,
        context.state,
        context.payload as TPayload,
        context.result,
        kind,
      );
    },
  };
};
