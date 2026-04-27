// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  FieldConfig,
  FieldController,
  FieldStateSnapshot,
  InactiveFieldPolicy,
  NormalizedFieldConfig,
  SelectorSubscriptionOptions,
} from "./field";
import type {
  ExplanationConfig,
  ExplanationController,
  ExplanationStateSnapshot,
} from "./explanation";
import type {
  NormalizedReportConfig,
  ReportConfig,
  ReportController,
  ReportStateSnapshot,
} from "./report";
import type {
  AfterSubmitContext,
  BeforeSubmitContext,
  SubmitOptions,
  SubmitResult,
  Transport,
  TransportStreamEvent,
  SubmitErrorContext,
} from "./transport";
import type { Registry } from "./registry";

type MaybePromise<T> = T | PromiseLike<T>;

export type FormStatus = "idle" | "editing" | "validating" | "submitting" | "success" | "error";

export interface FormValidationResult {
  valid: boolean;
  fields: Record<string, string[]>;
  formErrors: string[];
}

export interface SubmissionProgressState {
  loaded?: number;
  total?: number;
  message?: string;
  meta: Record<string, unknown>;
  chunkCount: number;
  sessionState?: "opening" | "open" | "closing" | "closed";
  bufferedMessages?: number;
  sessionMessageCount?: number;
  lastSessionMessageType?: string;
  lastEventType?: TransportStreamEvent["type"];
}

export interface FormState {
  status: FormStatus;
  submitCount: number;
  valid: boolean;
  dirty: boolean;
  touched: boolean;
  values: Record<string, unknown>;
  reportStates: Record<string, ReportStateSnapshot>;
  explanationStates: Record<string, ExplanationStateSnapshot>;
  submissionProgress: SubmissionProgressState | null;
  errors: {
    form: string[];
    fields: Record<string, string[]>;
  };
  lastResult: SubmitResult | null;
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

export interface AfterExplanationContext {
  explanationId: string;
  kind: string;
  result: unknown;
}

export interface ExplanationErrorContext {
  explanationId: string;
  kind: string;
  error: unknown;
}

export interface FormHooks {
  beforeValidate?: (context: BeforeValidateContext) => MaybePromise<void>;
  afterValidate?: (context: AfterValidateContext) => MaybePromise<void>;
  beforeSubmit?: (context: BeforeSubmitContext) => MaybePromise<void>;
  afterSubmit?: (context: AfterSubmitContext) => MaybePromise<void>;
  onSubmitError?: (context: SubmitErrorContext) => MaybePromise<void>;
  afterExplanation?: (context: AfterExplanationContext) => MaybePromise<void>;
  onExplanationError?: (context: ExplanationErrorContext) => MaybePromise<void>;
}

export interface FormSchema {
  fields: FieldConfig[];
  reports?: ReportConfig[];
  explanations?: ExplanationConfig[];
}

export interface CreateFormConfig {
  schema: FormSchema;
  registry: Registry;
  transport: Transport;
  initialValues?: Record<string, unknown>;
  validators?: FormValidator[];
  hooks?: FormHooks;
  hookFailurePolicy?: {
    afterSubmit?: "fail-submit" | "preserve-success";
  };
  inactiveFieldPolicy?: InactiveFieldPolicy;
  listenerErrorPolicy?: "ignore" | "throw-aggregate";
  onListenerError?: (error: unknown) => void;
}

export interface FormController {
  readonly fields: readonly FieldController[];
  readonly reports: readonly ReportController[];
  readonly explanations: readonly ExplanationController[];
  readonly state: FormState;
  getField(id: string): FieldController | undefined;
  getReport(id: string): ReportController | undefined;
  getExplanation(id: string): ExplanationController | undefined;
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

// Re-export SubmitErrorContext here since it's referenced in FormHooks but lives in transport
export type { SubmitErrorContext } from "./transport";
