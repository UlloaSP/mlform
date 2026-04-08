// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import { createRegistry } from "./registry";
import type {
  BaseFieldConfig,
  BaseReportConfig,
  DeclarativeFieldCondition,
  FieldDefinition,
  NormalizedFieldConfig,
  Registry,
  ReportDefinition,
  SubmitResult,
} from "./types";
import { toDate } from "./utils";

const uiSchema = z.record(z.string(), z.unknown()).optional();
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

const baseFieldShape = {
  id: z.string().optional(),
  label: z.string().min(1),
  description: z.string().optional(),
  required: z.boolean().optional().default(false),
  disabled: z.boolean().optional().default(false),
  hidden: z.boolean().optional().default(false),
  readOnly: z.boolean().optional().default(false),
  disabledWhen: fieldConditionSchema.optional(),
  hiddenWhen: fieldConditionSchema.optional(),
  readOnlyWhen: fieldConditionSchema.optional(),
  asyncValidationDebounceMs: z.number().int().nonnegative().optional(),
  defaultValue: z.unknown().optional(),
  ui: uiSchema,
};

const baseReportShape = {
  id: z.string().optional(),
  label: z.string().optional(),
  description: z.string().optional(),
  source: z.string().optional(),
  ui: uiSchema,
};

const optionSchema = z.union([
  z.string(),
  z.object({
    label: z.string(),
    value: z.string(),
  }),
]);

const resolveLegacyOutput = (result: SubmitResult, kind: string): unknown => {
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

const makeFieldDescriptor = (
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
    required: Boolean(config.required),
    disabled: Boolean(config.disabled),
    ...valueExtras,
    ...config.ui,
  },
});

type TextFieldConfig = BaseFieldConfig & {
  kind: "text";
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
};

type NumberFieldConfig = BaseFieldConfig & {
  kind: "number";
  min?: number;
  max?: number;
  step?: number;
};

type BooleanFieldConfig = BaseFieldConfig & {
  kind: "boolean";
};

type CategoryOption = string | { label: string; value: string };

type CategoryFieldConfig = BaseFieldConfig & {
  kind: "category";
  options: CategoryOption[];
};

type DateFieldConfig = BaseFieldConfig & {
  kind: "date";
  min?: string;
  max?: string;
};

type ClassifierReportConfig = BaseReportConfig & {
  kind: "classifier";
  labels?: string[];
  details?: boolean;
};

type RegressorReportConfig = BaseReportConfig & {
  kind: "regressor";
  unit?: string;
  precision?: number;
};

export const textFieldDefinition: FieldDefinition<TextFieldConfig, string> = {
  kind: "text",
  schema: z.object({
    kind: z.literal("text"),
    ...baseFieldShape,
    placeholder: z.string().optional(),
    minLength: z.number().int().nonnegative().optional(),
    maxLength: z.number().int().nonnegative().optional(),
    pattern: z.string().optional(),
  }),
  getDefaultValue(config) {
    return typeof config.defaultValue === "string" ? config.defaultValue : "";
  },
  normalizeValue(value) {
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
      return `${value}`;
    }
    return "";
  },
  validate(value, config) {
    const errors: string[] = [];
    if (config.minLength !== undefined && value.length < config.minLength) {
      errors.push(`Minimum length is ${config.minLength} characters.`);
    }
    if (config.maxLength !== undefined && value.length > config.maxLength) {
      errors.push(`Maximum length is ${config.maxLength} characters.`);
    }
    if (config.pattern && !new RegExp(config.pattern).test(value)) {
      errors.push("Value does not match the expected pattern.");
    }
    return errors;
  },
  describe(config, context) {
    return makeFieldDescriptor("text-field", config as NormalizedFieldConfig<TextFieldConfig>, {
      value: context.state.value,
      placeholder: config.placeholder ?? "",
      minLength: config.minLength,
      maxLength: config.maxLength,
      pattern: config.pattern,
      state: context.state.status,
      errors: context.state.errors,
    });
  },
};

export const numberFieldDefinition: FieldDefinition<NumberFieldConfig, number | null> = {
  kind: "number",
  schema: z.object({
    kind: z.literal("number"),
    ...baseFieldShape,
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().positive().optional(),
  }),
  getDefaultValue(config) {
    return typeof config.defaultValue === "number" ? config.defaultValue : null;
  },
  normalizeValue(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    if (typeof value === "number") {
      return Number.isNaN(value) ? null : value;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  },
  validate(value, config) {
    const errors: string[] = [];
    if (value === null) {
      return errors;
    }
    if (config.min !== undefined && value < config.min) {
      errors.push(`Minimum value is ${config.min}.`);
    }
    if (config.max !== undefined && value > config.max) {
      errors.push(`Maximum value is ${config.max}.`);
    }
    return errors;
  },
  describe(config, context) {
    return makeFieldDescriptor("number-field", config as NormalizedFieldConfig<NumberFieldConfig>, {
      value: context.state.value,
      min: config.min,
      max: config.max,
      step: config.step,
      state: context.state.status,
      errors: context.state.errors,
    });
  },
};

export const booleanFieldDefinition: FieldDefinition<BooleanFieldConfig, boolean> = {
  kind: "boolean",
  schema: z.object({
    kind: z.literal("boolean"),
    ...baseFieldShape,
  }),
  getDefaultValue(config) {
    return typeof config.defaultValue === "boolean" ? config.defaultValue : false;
  },
  normalizeValue(value) {
    return Boolean(value);
  },
  validate(value, config) {
    if (config.required && value !== true) {
      return ["This field must be accepted."];
    }
    return [];
  },
  describe(config, context) {
    return makeFieldDescriptor(
      "boolean-field",
      config as NormalizedFieldConfig<BooleanFieldConfig>,
      {
        checked: context.state.value,
        state: context.state.status,
        errors: context.state.errors,
      },
    );
  },
};

export const categoryFieldDefinition: FieldDefinition<CategoryFieldConfig, string | null> = {
  kind: "category",
  schema: z.object({
    kind: z.literal("category"),
    ...baseFieldShape,
    options: z.array(optionSchema).min(1),
  }),
  getDefaultValue(config) {
    return typeof config.defaultValue === "string" ? config.defaultValue : null;
  },
  normalizeValue(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      typeof value === "bigint"
    ) {
      return `${value}`;
    }
    return null;
  },
  validate(value, config) {
    if (value === null) {
      return [];
    }

    const allowedValues = config.options.map((option: CategoryOption) =>
      typeof option === "string" ? option : option.value,
    );

    return allowedValues.includes(value) ? [] : ["Value must match one of the available options."];
  },
  describe(config, context) {
    return makeFieldDescriptor(
      "category-field",
      config as NormalizedFieldConfig<CategoryFieldConfig>,
      {
        value: context.state.value,
        options: config.options,
        state: context.state.status,
        errors: context.state.errors,
      },
    );
  },
};

export const dateFieldDefinition: FieldDefinition<DateFieldConfig, Date | null> = {
  kind: "date",
  schema: z.object({
    kind: z.literal("date"),
    ...baseFieldShape,
    min: z.string().optional(),
    max: z.string().optional(),
  }),
  getDefaultValue(config) {
    return toDate(config.defaultValue) ?? null;
  },
  normalizeValue(value) {
    return toDate(value);
  },
  serializeValue(value) {
    return value instanceof Date ? value.toISOString() : value;
  },
  validate(value, config) {
    if (value === null) {
      return [];
    }

    const errors: string[] = [];
    const minDate = toDate(config.min);
    const maxDate = toDate(config.max);

    if (minDate && value.getTime() < minDate.getTime()) {
      errors.push(`Date must be on or after ${config.min}.`);
    }
    if (maxDate && value.getTime() > maxDate.getTime()) {
      errors.push(`Date must be on or before ${config.max}.`);
    }

    return errors;
  },
  describe(config, context) {
    return makeFieldDescriptor("date-field", config as NormalizedFieldConfig<DateFieldConfig>, {
      value:
        context.state.value instanceof Date
          ? context.state.value.toISOString().slice(0, 10)
          : context.state.value,
      min: config.min,
      max: config.max,
      state: context.state.status,
      errors: context.state.errors,
    });
  },
};

export const classifierReportDefinition: ReportDefinition<ClassifierReportConfig> = {
  kind: "classifier",
  schema: z.object({
    kind: z.literal("classifier"),
    ...baseReportShape,
    labels: z.array(z.string()).optional(),
    details: z.boolean().optional().default(true),
  }),
  resolvePayload(_config, context) {
    return (
      context.result.reports[context.report.source] ??
      resolveLegacyOutput(context.result, "classifier")
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
        label: config.label ?? "Classifier report",
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
      resolveLegacyOutput(context.result, "regressor")
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
        label: config.label ?? "Regressor report",
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

export const createBuiltinRegistry = (): Registry => {
  const registry = createRegistry();

  registry
    .registerField(textFieldDefinition)
    .registerField(numberFieldDefinition)
    .registerField(booleanFieldDefinition)
    .registerField(categoryFieldDefinition)
    .registerField(dateFieldDefinition)
    .registerReport(classifierReportDefinition)
    .registerReport(regressorReportDefinition);

  return registry;
};
