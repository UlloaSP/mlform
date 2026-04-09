// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { builtinLegacyOutputTypes, builtinReportLabels } from "../../constants";
import type { BaseReportConfig, ReportDefinition } from "../../types";
import { baseReportShape, resolveLegacyOutput } from "../shared";

type RegressorReportConfig = BaseReportConfig & {
  kind: "regressor";
  unit?: string;
  precision?: number;
};

export const regressorReportDefinition: ReportDefinition<RegressorReportConfig> = {
  kind: "regressor",
  schema: z.object({
    kind: z.literal("regressor"),
    ...baseReportShape,
    unit: z.string().optional(),
    precision: z.number().int().nonnegative().optional().default(2),
  }),
  resolvePayload(_config, context) {
    return (
      context.result.reports[context.report.source] ??
      resolveLegacyOutput(context.result, builtinLegacyOutputTypes.regressor)
    );
  },
  describe(config, context) {
    if (context.state.status === "idle" && context.payload === undefined) {
      return null;
    }

    return {
      component: "regressor-report",
      props: {
        id: context.reportId,
        kind: config.kind,
        label: config.label ?? builtinReportLabels.regressor,
        description: config.description ?? "",
        payload: context.payload,
        error: context.state.error,
        state: context.state.status,
        unit: config.unit,
        precision: config.precision,
        ...config.ui,
      },
    };
  },
};
