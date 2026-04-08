// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ZodType } from "zod";

export type MaybePromise<T> = T | PromiseLike<T>;

export type FieldStatus = "idle" | "validating" | "valid" | "invalid";
export type ReportStatus = "idle" | "ready" | "error";
export type FormStatus = "idle" | "editing" | "validating" | "submitting" | "success" | "error";

export interface FieldDescriptor {
  component: string;
  props: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface ReportDescriptor {
  component: string;
  props: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface BaseFieldConfig {
  id?: string;
  kind: string;
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  readOnly?: boolean;
  disabledWhen?: FieldCondition;
  hiddenWhen?: FieldCondition;
  readOnlyWhen?: FieldCondition;
  asyncValidationDebounceMs?: number;
  defaultValue?: unknown;
  ui?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface BaseReportConfig {
  id?: string;
  kind: string;
  label?: string;
  description?: string;
  source?: string;
  ui?: Record<string, unknown>;
  [key: string]: unknown;
}

export type FieldConfig = BaseFieldConfig;
export type ReportConfig = BaseReportConfig;

export type NormalizedFieldConfig<TConfig extends FieldConfig = FieldConfig> = TConfig & {
  id: string;
};

export type NormalizedReportConfig<TConfig extends ReportConfig = ReportConfig> = TConfig & {
  id: string;
  source: string;
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

export interface ReportStateSnapshot {
  payload: unknown;
  error: string | null;
  status: ReportStatus;
}

export interface SubmitRequest {
  values: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  fields: readonly NormalizedFieldConfig[];
  reports: readonly NormalizedReportConfig[];
  signal?: AbortSignal;
}

export interface TransportResponse {
  reports?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  raw?: unknown;
}

export interface SubmitResult {
  values: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  reports: Record<string, unknown>;
  reportStates: Record<string, ReportStateSnapshot>;
  meta: Record<string, unknown>;
  raw: unknown;
}

export interface FieldValidationResult {
  fieldId: string;
  valid: boolean;
  errors: string[];
}

export interface FormValidationResult {
  valid: boolean;
  fields: Record<string, string[]>;
  formErrors: string[];
}

export interface FormState {
  status: FormStatus;
  submitCount: number;
  valid: boolean;
  dirty: boolean;
  touched: boolean;
  values: Record<string, unknown>;
  errors: {
    form: string[];
    fields: Record<string, string[]>;
  };
  lastResult: SubmitResult | null;
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

export interface FieldDescriptorContext {
  fieldId: string;
  state: FieldStateSnapshot;
}

export interface ReportDescriptorContext {
  reportId: string;
  state: ReportStateSnapshot;
  payload: unknown;
  result: SubmitResult | null;
}

export interface ReportPayloadContext<TConfig extends ReportConfig = ReportConfig> {
  report: NormalizedReportConfig<TConfig>;
  result: SubmitResult;
}

export interface FormValidationIssue {
  form?: string[];
  fields?: Record<string, string[]>;
}

export interface FormValidationContext {
  values: Record<string, unknown>;
  submitCount: number;
  formStatus: FormStatus;
  fields: Record<string, FieldStateSnapshot>;
  schema: {
    fields: readonly NormalizedFieldConfig[];
    reports: readonly NormalizedReportConfig[];
  };
}

export type FormValidator = (
  context: FormValidationContext,
) => MaybePromise<FormValidationIssue | string[] | void>;

export interface BeforeValidateContext {
  values: Record<string, unknown>;
  submitCount: number;
}

export interface AfterValidateContext {
  values: Record<string, unknown>;
  result: FormValidationResult;
  submitCount: number;
}

export interface BeforeSubmitContext {
  values: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  submitCount: number;
  signal: AbortSignal;
}

export interface AfterSubmitContext {
  values: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  submitCount: number;
  result: SubmitResult;
}

export interface SubmitErrorContext {
  values: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  submitCount: number;
  error: unknown;
}

export interface FormHooks {
  beforeValidate?: (context: BeforeValidateContext) => MaybePromise<void>;
  afterValidate?: (context: AfterValidateContext) => MaybePromise<void>;
  beforeSubmit?: (context: BeforeSubmitContext) => MaybePromise<void>;
  afterSubmit?: (context: AfterSubmitContext) => MaybePromise<void>;
  onSubmitError?: (context: SubmitErrorContext) => MaybePromise<void>;
}

export interface FieldDefinition<TConfig extends FieldConfig = FieldConfig, TValue = unknown> {
  kind: string;
  schema: ZodType<TConfig>;
  getDefaultValue?: (config: TConfig) => TValue;
  normalizeValue?: (value: unknown, config: TConfig) => TValue;
  serializeValue?: (value: TValue, config: TConfig) => unknown;
  validate?: (
    value: TValue,
    config: TConfig,
    context: FieldValidationContext<TConfig>,
  ) => MaybePromise<string[]>;
  describe: (config: TConfig, context: FieldDescriptorContext) => FieldDescriptor;
}

export interface ReportDefinition<TConfig extends ReportConfig = ReportConfig> {
  kind: string;
  schema: ZodType<TConfig>;
  resolvePayload?: (config: TConfig, context: ReportPayloadContext<TConfig>) => unknown;
  describe: (config: TConfig, context: ReportDescriptorContext) => ReportDescriptor | null;
}

export interface Registry {
  registerField(definition: FieldDefinition<any, any>): Registry;
  registerReport(definition: ReportDefinition<any>): Registry;
  getField(kind: string): FieldDefinition<any, any> | undefined;
  getReport(kind: string): ReportDefinition<any> | undefined;
  listFields(): FieldDefinition<any, any>[];
  listReports(): ReportDefinition<any>[];
}

export interface Transport {
  submit: (request: SubmitRequest) => Promise<unknown>;
}

export interface FormSchema {
  fields: FieldConfig[];
  reports?: ReportConfig[];
}

export interface CreateFormConfig {
  schema: FormSchema;
  registry: Registry;
  transport: Transport;
  initialValues?: Record<string, unknown>;
  validators?: FormValidator[];
  hooks?: FormHooks;
  inactiveFieldPolicy?: "include" | "omit";
}

export interface SelectorSubscriptionOptions<TSelected> {
  emitInitial?: boolean;
  equality?: (previous: TSelected, next: TSelected) => boolean;
}

export interface SubmitOptions {
  signal?: AbortSignal;
}

export interface FieldController {
  readonly id: string;
  readonly kind: string;
  readonly config: NormalizedFieldConfig;
  readonly state: FieldStateSnapshot;
  readonly descriptor: FieldDescriptor;
  setValue(value: unknown): void;
  blur(): void;
  focus(): void;
  validate(): Promise<FieldValidationResult>;
  reset(): void;
  subscribe(listener: (state: FieldStateSnapshot) => void): () => void;
}

export interface ReportController {
  readonly id: string;
  readonly kind: string;
  readonly config: NormalizedReportConfig;
  readonly state: ReportStateSnapshot;
  readonly descriptor: ReportDescriptor | null;
  subscribe(listener: (state: ReportStateSnapshot) => void): () => void;
}

export interface FormController {
  readonly fields: readonly FieldController[];
  readonly reports: readonly ReportController[];
  readonly state: FormState;
  getField(id: string): FieldController | undefined;
  getReport(id: string): ReportController | undefined;
  getValues(): Record<string, unknown>;
  setValues(values: Record<string, unknown>): void;
  validate(): Promise<FormValidationResult>;
  submit(options?: SubmitOptions): Promise<SubmitResult>;
  abortSubmit(reason?: string): void;
  reset(): void;
  subscribe(listener: (state: FormState) => void): () => void;
  subscribeSelector<TSelected>(
    selector: (state: FormState) => TSelected,
    listener: (selected: TSelected, state: FormState) => void,
    options?: SelectorSubscriptionOptions<TSelected>,
  ): () => void;
}
