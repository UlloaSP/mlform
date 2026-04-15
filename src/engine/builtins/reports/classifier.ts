// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { builtinLegacyOutputTypes, builtinReportLabels } from "../../constants";
import type { BaseReportConfig, ReportDefinition } from "../../types";
import { baseReportShape, resolveLegacyOutput } from "../shared";

type ClassifierReportConfig = BaseReportConfig & {
  kind: "classifier";
  labels?: string[];
  details?: boolean;
};

export const classifierReportDefinition: ReportDefinition<ClassifierReportConfig> = {
  kind: "classifier",
  partialUpdatePolicy: "validate",
  schema: z.object({
    kind: z.literal("classifier"),
    ...baseReportShape,
    labels: z.array(z.string()).optional(),
    details: z.boolean().optional().default(true),
  }),
  resolvePayload(_config, context) {
    return (
      context.result.reports[context.report.source] ??
      resolveLegacyOutput(context.result, builtinLegacyOutputTypes.classifier)
    );
  },
  describe(config, context) {
    if (context.state.status === "idle" && context.payload === undefined) {
      return null;
    }

    return {
      component: "classifier-report",
      props: {
        id: context.reportId,
        kind: config.kind,
        label: config.label ?? builtinReportLabels.classifier,
        description: config.description ?? "",
        payload: context.payload,
        error: context.state.error,
        state: context.state.status,
        details: config.details,
        labels: config.labels,
        ...config.ui,
      },
    };
  },
};
