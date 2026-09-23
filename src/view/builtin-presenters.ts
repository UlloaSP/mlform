// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { builtinReportLabels, seriesFieldDefinition } from "@/builtins";
import {
  createPrimitiveDescriptorRegistry,
  type FieldDescriptorContext,
  type FieldPresenter,
  type PrimitiveDescriptorRegistry,
  type ReportDescriptorContext,
  type ReportPresenter,
} from "@/primitives";
import type { NormalizedFieldConfig, NormalizedReportConfig } from "@/schema";

type Option = string | { label: string; value: string; [key: string]: unknown };

type BuiltinFieldConfig = NormalizedFieldConfig & {
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number | string;
  max?: number | string;
  step?: number;
  unit?: string;
  rows?: number;
  trueLabel?: string;
  falseLabel?: string;
  options?: readonly Option[];
  layout?: "horizontal" | "vertical";
  field1?: unknown;
  field2?: unknown;
  minPoints?: number;
  maxPoints?: number;
};

type BuiltinReportConfig = NormalizedReportConfig & {
  labels?: string[];
  showClassProbabilities?: boolean;
  unit?: string;
  precision?: number;
};

type FieldContext = FieldDescriptorContext & { value: unknown };
type FieldProps = (config: BuiltinFieldConfig, context: FieldContext) => Record<string, unknown>;

const fieldPresenter = (
  kind: string,
  component: string,
  fieldProps: FieldProps,
): FieldPresenter<BuiltinFieldConfig, unknown> => ({
  kind,
  describe(config, context) {
    return {
      component,
      props: {
        id: context.fieldId,
        kind: config.kind,
        label: config.label,
        description: config.description ?? "",
        showDescriptionInline: config.showDescriptionInline ?? false,
        required: config.required ?? false,
        disabled: config.disabled ?? false,
        ...fieldProps(config, context),
        ...config.ui,
      },
    };
  },
});

const fieldState = (_config: BuiltinFieldConfig, context: FieldContext) => ({
  value: context.state.value,
  state: context.state.status,
  errors: context.state.errors,
});

const options = (config: BuiltinFieldConfig): readonly Option[] => config.options ?? [];
const displayOptions = (config: BuiltinFieldConfig): Option[] =>
  options(config).map((option) =>
    typeof option === "string" ? option : { label: option.label, value: option.value },
  );

const builtinFieldPresenters: readonly FieldPresenter<BuiltinFieldConfig, unknown>[] = [
  fieldPresenter("text", "text-field", (config, context) => ({
    ...fieldState(config, context),
    placeholder: config.placeholder ?? "",
    minLength: config.minLength,
    maxLength: config.maxLength,
    pattern: config.pattern,
  })),
  fieldPresenter("number", "number-field", (config, context) => ({
    ...fieldState(config, context),
    min: config.min,
    max: config.max,
    step: config.step,
    unit: config.unit,
    placeholder: config.placeholder ?? "",
    input:
      config.min !== undefined &&
      config.max !== undefined &&
      !config.required &&
      context.state.value !== null
        ? "range"
        : "text",
  })),
  fieldPresenter("boolean", "boolean-field", (config, context) => ({
    checked: context.state.value,
    trueLabel: config.trueLabel,
    falseLabel: config.falseLabel,
    state: context.state.status,
    errors: context.state.errors,
  })),
  fieldPresenter("category", "category-field", (config, context) => ({
    ...fieldState(config, context),
    options: options(config),
  })),
  fieldPresenter("mapped-category", "category-field", (config, context) => ({
    ...fieldState(config, context),
    options: displayOptions(config),
  })),
  fieldPresenter("onehot-category", "category-field", (config, context) => ({
    ...fieldState(config, context),
    options: displayOptions(config),
  })),
  fieldPresenter("date", "date-field", (config, context) => ({
    ...fieldState(config, context),
    value:
      context.state.value instanceof Date
        ? context.state.value.toISOString().slice(0, 10)
        : context.state.value,
    min: config.min,
    max: config.max,
    step: config.step,
  })),
  fieldPresenter("series", "series-field", (config, context) => ({
    ...fieldState(config, context),
    value: Array.isArray(context.state.value)
      ? seriesFieldDefinition.serializeValue?.(context.state.value as never, config as never)
      : [],
    field1: config.field1,
    field2: config.field2,
    minPoints: config.minPoints,
    maxPoints: config.maxPoints,
  })),
  fieldPresenter("long-text", "long-text-field", (config, context) => ({
    ...fieldState(config, context),
    placeholder: config.placeholder ?? "",
    minLength: config.minLength,
    maxLength: config.maxLength,
    rows: config.rows,
  })),
  fieldPresenter("single-choice", "single-choice-field", (config, context) => ({
    ...fieldState(config, context),
    options: options(config),
    layout: config.layout ?? "vertical",
  })),
  fieldPresenter("multi-choice", "multi-choice-field", (config, context) => ({
    ...fieldState(config, context),
    options: options(config),
    layout: config.layout ?? "vertical",
  })),
  fieldPresenter("rating", "rating-field", (config, context) => ({
    ...fieldState(config, context),
    min: config.min ?? 1,
    max: config.max,
    step: config.step ?? 1,
  })),
];

const reportPresenter = (
  kind: "classifier" | "regressor",
  component: string,
  extras: (config: BuiltinReportConfig) => Record<string, unknown>,
): ReportPresenter<BuiltinReportConfig> => ({
  kind,
  describe(config, context: ReportDescriptorContext) {
    return {
      component,
      props: {
        id: context.reportId,
        kind: config.kind,
        label: config.label ?? builtinReportLabels[kind],
        description: config.description ?? "",
        payload: context.payload,
        error: context.state.error,
        state: context.state.status,
        ...extras(config),
        ...config.ui,
      },
    };
  },
});

const builtinReportPresenters = [
  reportPresenter("classifier", "classifier-report", (config) => ({
    showClassProbabilities: config.showClassProbabilities,
    labels: config.labels,
  })),
  reportPresenter("regressor", "regressor-report", (config) => ({
    unit: config.unit,
    precision: config.precision,
  })),
];

export const createBuiltinDescriptorRegistry = (): PrimitiveDescriptorRegistry => {
  const registry = createPrimitiveDescriptorRegistry();
  for (const presenter of builtinFieldPresenters) registry.registerField(presenter);
  for (const presenter of builtinReportPresenters) registry.registerReport(presenter);
  return registry;
};
