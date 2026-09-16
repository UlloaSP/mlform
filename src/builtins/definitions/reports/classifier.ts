// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { builtinReportLabels } from "../../constants";
import { resolveMappedReportPayload, type BaseReportConfig } from "@/schema";
import { baseReportShape, type BuiltinReportDefinition } from "../shared";

type ClassifierReportConfig = BaseReportConfig & {
  kind: "classifier";
  labels?: string[];
  showClassProbabilities?: boolean;
};

export const classifierReportDefinition: BuiltinReportDefinition<ClassifierReportConfig> = {
  kind: "classifier",
  schema: z.object({
    kind: z.literal("classifier"),
    ...baseReportShape,
    labels: z.array(z.string()).optional(),
    showClassProbabilities: z.boolean().optional().default(true),
  }),
  resolvePayload(_config, context) {
    return resolveMappedReportPayload(context.report, context.result);
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
        showClassProbabilities: config.showClassProbabilities,
        labels: config.labels,
        ...config.ui,
      },
    };
  },
};
