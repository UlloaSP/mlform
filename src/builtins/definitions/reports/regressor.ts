// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { resolveMappedReportPayload, type BaseReportConfig } from "@/schema";
import { baseReportShape, type BuiltinReportDefinition } from "../shared";

type RegressorReportConfig = BaseReportConfig & {
  kind: "regressor";
  unit?: string;
  precision?: number;
};

export const regressorReportDefinition: BuiltinReportDefinition<RegressorReportConfig> = {
  kind: "regressor",
  schema: z.object({
    kind: z.literal("regressor"),
    ...baseReportShape,
    unit: z.string().optional(),
    precision: z.number().int().nonnegative().optional().default(2),
  }),
  resolvePayload(_config, context) {
    return resolveMappedReportPayload(context.report, context.result);
  },
};
