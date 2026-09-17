// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import type {
  BaseFieldConfig,
  BaseReportConfig,
  FieldConfig,
  FieldDefinition,
  ReportConfig,
  ReportDefinition,
} from "@/schema";
import { baseFieldConfigSchema, baseReportConfigSchema, mappedToSchema } from "@/schema";

export { mappedToSchema };
export const baseFieldShape = baseFieldConfigSchema.omit({ kind: true }).shape;
export const baseReportShape = baseReportConfigSchema.omit({ kind: true }).shape;

export const optionSchema = z.union([
  z.string(),
  z.object({
    label: z.string(),
    value: z.string(),
  }),
]);

export type BuiltinFieldConfig = BaseFieldConfig;
export type BuiltinReportConfig = BaseReportConfig;

export type BuiltinFieldDefinition<
  TConfig extends FieldConfig = FieldConfig,
  TValue = unknown,
> = FieldDefinition<TConfig, TValue>;

export type BuiltinReportDefinition<TConfig extends ReportConfig = ReportConfig> =
  ReportDefinition<TConfig>;
