// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import type {
  BaseFieldConfig,
  BaseReportConfig,
  DeclarativeFieldCondition,
  FieldConfig,
  FieldDefinition,
  NormalizedFieldConfig,
  ReportConfig,
  ReportDefinition,
  SubmitResult,
} from "@/schema";
import type { FieldDescriptor, ReportDescriptor } from "@/presentation";

export const uiSchema = z.record(z.string(), z.unknown()).optional();

const functionFieldConditionSchema = z.custom<(context: unknown) => boolean>(
  (value) => typeof value === "function",
);

const formStatusSchema = z.enum([
  "idle",
  "editing",
  "validating",
  "submitting",
  "success",
  "error",
]);

const declarativeFieldConditionSchema: z.ZodType<DeclarativeFieldCondition> = z.lazy(() =>
  z.union([
    z.object({
      kind: z.literal("field-value"),
      field: z.string().min(1),
      equals: z.unknown().optional(),
      notEquals: z.unknown().optional(),
      greaterThan: z.unknown().optional(),
      greaterThanOrEqual: z.unknown().optional(),
      lessThan: z.unknown().optional(),
      lessThanOrEqual: z.unknown().optional(),
      in: z.array(z.unknown()).optional(),
      notIn: z.array(z.unknown()).optional(),
      empty: z.boolean().optional(),
      notEmpty: z.boolean().optional(),
      truthy: z.boolean().optional(),
      falsy: z.boolean().optional(),
    }),
    z.object({
      kind: z.literal("field-comparison"),
      field: z.string().min(1),
      otherField: z.string().min(1),
      operator: z.enum(["eq", "neq", "gt", "gte", "lt", "lte"]),
    }),
    z.object({
      kind: z.literal("form-status"),
      equals: z.union([formStatusSchema, z.array(formStatusSchema).min(1)]),
    }),
    z.object({
      kind: z.literal("submit-count"),
      eq: z.number().int().nonnegative().optional(),
      gte: z.number().int().nonnegative().optional(),
      lte: z.number().int().nonnegative().optional(),
    }),
    z.object({
      kind: z.literal("all"),
      conditions: z.array(declarativeFieldConditionSchema).min(1),
    }),
    z.object({
      kind: z.literal("any"),
      conditions: z.array(declarativeFieldConditionSchema).min(1),
    }),
    z.object({
      kind: z.literal("not"),
      condition: declarativeFieldConditionSchema,
    }),
  ]),
);

const fieldConditionSchema = z.union([
  functionFieldConditionSchema,
  declarativeFieldConditionSchema,
]);

export const baseFieldShape = {
  id: z.string().optional(),
  label: z.string().min(1),
  description: z.string().optional(),
  showDescriptionInline: z.boolean().optional().default(false),
  required: z.boolean().optional().default(false),
  disabled: z.boolean().optional().default(false),
  hidden: z.boolean().optional().default(false),
  readOnly: z.boolean().optional().default(false),
  disabledWhen: fieldConditionSchema.optional(),
  hiddenWhen: fieldConditionSchema.optional(),
  readOnlyWhen: fieldConditionSchema.optional(),
  asyncValidationDebounceMs: z.number().int().nonnegative().optional(),
  inactiveFieldPolicy: z.enum(["include", "omit", "reset-on-hide"]).optional(),
  includeInSubmission: z.boolean().optional(),
  valuePath: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]).optional(),
  defaultValue: z.unknown().optional(),
  ui: uiSchema,
};

export const baseReportShape = {
  id: z.string().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
  source: z.string().optional(),
  ui: uiSchema,
};

export const optionSchema = z.union([
  z.string(),
  z.object({
    label: z.string(),
    value: z.string(),
  }),
]);

export const resolveLegacyOutput = (result: SubmitResult, kind: string): unknown => {
  const raw = result.raw;
  if (
    typeof raw !== "object" ||
    raw === null ||
    !("outputs" in raw) ||
    !Array.isArray((raw as { outputs?: unknown[] }).outputs)
  ) {
    return undefined;
  }

  return (raw as { outputs: Array<Record<string, unknown>> }).outputs.find(
    (output) => output.type === kind,
  );
};

export const makeFieldDescriptor = (
  component: string,
  config: NormalizedFieldConfig,
  valueExtras: Record<string, unknown>,
) => ({
  component,
  props: {
    id: config.id,
    kind: config.kind,
    label: config.label,
    description: config.description ?? "",
    showDescriptionInline: Boolean(config.showDescriptionInline),
    required: Boolean(config.required),
    disabled: Boolean(config.disabled),
    ...valueExtras,
    ...config.ui,
  },
});

export type BuiltinFieldConfig = BaseFieldConfig;
export type BuiltinReportConfig = BaseReportConfig;

export type BuiltinFieldDefinition<
  TConfig extends FieldConfig = FieldConfig,
  TValue = unknown,
> = FieldDefinition<TConfig, TValue> & {
  describe: (
    config: NormalizedFieldConfig<TConfig>,
    context: { fieldId: string; state: import("@/schema").FieldStateSnapshot },
  ) => FieldDescriptor;
};

export type BuiltinReportDefinition<TConfig extends ReportConfig = ReportConfig> =
  ReportDefinition<TConfig> & {
    describe: (
      config: import("@/schema").NormalizedReportConfig<TConfig>,
      context: {
        reportId: string;
        state: import("@/schema").ReportStateSnapshot;
        payload: unknown;
        result: SubmitResult | null;
      },
    ) => ReportDescriptor | null;
  };
