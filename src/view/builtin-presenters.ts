// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import {
  builtinReportLabels,
  calculateSeriesAggregation,
  getSeriesCellErrors,
  seriesFieldDefinition,
  type SeriesAggregation,
  type SeriesFieldConfig,
  type SeriesPoint,
} from "@/builtins";
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
  columns?: SeriesFieldConfig["columns"];
  minPoints?: number;
  maxPoints?: number;
  aggregations?: SeriesAggregation[];
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

const aggregationUnit = (aggregation: SeriesAggregation, sourceUnit: unknown): unknown => {
  if (
    ["count", "distinct-count", "product", "cv", "skewness", "kurtosis"].includes(
      aggregation.operation,
    )
  ) {
    return undefined;
  }
  if (typeof sourceUnit !== "string") return undefined;
  return aggregation.operation === "variance" ? `${sourceUnit}²` : sourceUnit;
};

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
      typeof config.defaultValue === "number"
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
  fieldPresenter("series", "series-field", (config, context) => {
    const series = config as SeriesFieldConfig;
    const points = Array.isArray(context.state.value) ? (context.state.value as SeriesPoint[]) : [];
    const sources = new Set(series.aggregations?.map((aggregation) => aggregation.source));
    return {
      ...fieldState(config, context),
      value: seriesFieldDefinition.serializeValue?.(points, series),
      columns: series.columns.map((column) => ({
        ...column,
        required: column.required || sources.has(column.id),
      })),
      cellErrors: getSeriesCellErrors(points, series, context.formatMessage),
      minPoints: config.minPoints,
      maxPoints: config.maxPoints,
      aggregationResults: series.showAggregationSummary
        ? series.aggregations?.map((aggregation) => ({
            label: aggregation.label,
            value: calculateSeriesAggregation(points, aggregation),
            unit: aggregationUnit(
              aggregation,
              series.columns.find((column) => column.id === aggregation.source)?.unit,
            ),
          }))
        : undefined,
    };
  }),
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
