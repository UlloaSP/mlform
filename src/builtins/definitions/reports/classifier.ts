// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
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
};
