// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ZodType } from "zod";

export type MaybePromise<T> = T | PromiseLike<T>;
export type FormStatus = "idle" | "editing" | "validating" | "submitting" | "success" | "error";
export type FieldStatus = "idle" | "validating" | "valid" | "invalid";
export type InactiveFieldPolicy = "include" | "omit" | "reset-on-hide";

export interface BaseFieldConfig {
  id?: string;
  kind: string;
  label: string;
  description?: string;
  showDescriptionInline?: boolean;
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  readOnly?: boolean;
  disabledWhen?: FieldCondition;
  hiddenWhen?: FieldCondition;
  readOnlyWhen?: FieldCondition;
  asyncValidationDebounceMs?: number;
  inactiveFieldPolicy?: InactiveFieldPolicy;
  includeInSubmission?: boolean;
  valuePath?: string | string[];
  defaultValue?: unknown;
  ui?: Record<string, unknown>;
  [key: string]: unknown;
}

export type FieldConfig = BaseFieldConfig;

export type NormalizedFieldConfig<TConfig extends FieldConfig = FieldConfig> = TConfig & {
  id: string;
};

export interface FieldStateSnapshot {
  value: unknown;
  initialValue: unknown;
  touched: boolean;
  dirty: boolean;
  valid: boolean;
  visible: boolean;
  disabled: boolean;
  readOnly: boolean;
  errors: string[];
  status: FieldStatus;
}

export interface FieldValidationResult {
  fieldId: string;
  valid: boolean;
  errors: string[];
}

export interface FieldValidationContext<TConfig extends FieldConfig = FieldConfig> {
  field: NormalizedFieldConfig<TConfig>;
  values: Record<string, unknown>;
  submitCount: number;
  validationVersion: number;
  signal?: AbortSignal;
}

export interface FieldConditionContext<TConfig extends FieldConfig = FieldConfig> {
  field: NormalizedFieldConfig<TConfig>;
  values: Record<string, unknown>;
  submitCount: number;
  formStatus: FormStatus;
}

export interface FieldValueCondition {
  kind: "field-value";
  field: string;
  equals?: unknown;
  notEquals?: unknown;
  greaterThan?: unknown;
  greaterThanOrEqual?: unknown;
  lessThan?: unknown;
  lessThanOrEqual?: unknown;
  in?: unknown[];
  notIn?: unknown[];
  empty?: boolean;
  notEmpty?: boolean;
  truthy?: boolean;
  falsy?: boolean;
}

export interface FieldComparisonCondition {
  kind: "field-comparison";
  field: string;
  otherField: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte";
}

export interface FormStatusCondition {
  kind: "form-status";
  equals: FormStatus | FormStatus[];
}

export interface SubmitCountCondition {
  kind: "submit-count";
  eq?: number;
  gte?: number;
  lte?: number;
}

export interface AllConditions {
  kind: "all";
  conditions: DeclarativeFieldCondition[];
}

export interface AnyConditions {
  kind: "any";
  conditions: DeclarativeFieldCondition[];
}

export interface NotCondition {
  kind: "not";
  condition: DeclarativeFieldCondition;
}

export type DeclarativeFieldCondition =
  | FieldValueCondition
  | FieldComparisonCondition
  | FormStatusCondition
  | SubmitCountCondition
  | AllConditions
  | AnyConditions
  | NotCondition;

export type FieldCondition<TConfig extends FieldConfig = FieldConfig> =
  | DeclarativeFieldCondition
  | ((context: FieldConditionContext<TConfig>) => boolean);

export interface FieldValueAdapter<TConfig extends FieldConfig = FieldConfig, TValue = unknown> {
  default?: (config: TConfig) => TValue;
  normalize?: (value: unknown, config: TConfig) => TValue;
  clone?: (value: TValue, config: TConfig) => TValue;
  isEqual?: (previous: TValue, next: TValue, config: TConfig) => boolean;
  serialize?: (value: TValue, config: TConfig) => unknown;
}

export interface FieldValidationFnContext<
  TConfig extends FieldConfig = FieldConfig,
  TValue = unknown,
> extends FieldValidationContext<TConfig> {
  config: TConfig;
  value: TValue;
}

export interface FieldDefinition<TConfig extends FieldConfig = FieldConfig, TValue = unknown> {
  kind: string;
  schema: ZodType<TConfig>;
  getDefaultValue?: (config: TConfig) => TValue;
  normalizeValue?: (value: unknown, config: TConfig) => TValue;
  cloneValue?: (value: TValue, config: TConfig) => TValue;
  isEqual?: (previous: TValue, next: TValue, config: TConfig) => boolean;
  serializeValue?: (value: TValue, config: TConfig) => unknown;
  validate?: (
    value: TValue,
    config: TConfig,
    context: FieldValidationContext<TConfig>,
  ) => MaybePromise<string[]>;
}

export interface SelectorSubscriptionOptions<TSelected> {
  emitInitial?: boolean;
  equality?: (previous: TSelected, next: TSelected) => boolean;
}
