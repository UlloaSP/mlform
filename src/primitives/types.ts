// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  ExplanationController,
  ExplanationDescriptor,
  ExplanationFetchRequest,
  ExplanationFetchTransport,
  FieldController,
  FieldDescriptor,
  FormController,
  FormState,
  FormStatus,
  ReportController,
  ReportDescriptor,
  SubmitResult,
} from "@/engine";
import type { PrimitiveText, PrimitiveTextOverrides } from "./constants";

export type PrimitiveLayout = "stacked" | "split";
export type PrimitiveContainerStrategy = "error" | "replace";

export interface PrimitiveRegistry {
  // --- Fields ---
  registerField(component: string, tagName: string): PrimitiveRegistry;
  unregisterField(component: string): PrimitiveRegistry;
  resolveField(component: string): string | undefined;

  // --- Reports ---
  registerReport(component: string, tagName: string): PrimitiveRegistry;
  unregisterReport(component: string): PrimitiveRegistry;
  resolveReport(component: string): string | undefined;

  // --- Explanations ---
  registerExplanation(component: string, tagName: string): PrimitiveRegistry;
  unregisterExplanation(component: string): PrimitiveRegistry;
  resolveExplanation(component: string): string | undefined;

  clone(): PrimitiveRegistry;
}

/**
 * Request passed to a PrimitiveReportTransport when a report becomes ready.
 * Contains the full submit result so a report renderer can fetch any
 * post-submit data it needs, plus the `reportId` identifying that report.
 */
export interface PrimitiveReportRequest {
  reportId: string;
  backend?: string;
  values: Record<string, unknown>;
  fieldValues: Record<string, unknown>;
  serializedValues: Record<string, unknown>;
  serializedFieldValues: Record<string, unknown>;
  reports: Record<string, unknown>;
  meta: Record<string, unknown>;
  raw: unknown;
  signal?: AbortSignal;
}

/**
 * Transport for fetching post-submit report content.
 * Receives the full submit result + report context; may return any value.
 * Renderers decide how to display loading, success, and error states.
 */
export interface PrimitiveReportTransport {
  submit: (request: PrimitiveReportRequest) => Promise<unknown>;
}

/**
 * Re-exports of engine explanation types for convenience in the primitives
 * layer. Explanation transport is now per-plugin (defined in ExplanationDefinition)
 * rather than a global mount-time option.
 */
export type ExplanationRequest = ExplanationFetchRequest;
export type ExplanationTransport = ExplanationFetchTransport;

export interface MountFormOptions {
  registry?: PrimitiveRegistry;
  layout?: PrimitiveLayout;
  containerStrategy?: PrimitiveContainerStrategy;
  formLabel?: string;
  reportsLabel?: string;
  submitLabel?: string;
  validatingLabel?: string;
  submittingLabel?: string;
  reportPane?: "auto" | "always" | "hidden";
  text?: PrimitiveTextOverrides;
  /** Optional transport for report renderers that fetch extra data after submit. */
  reportTransport?: PrimitiveReportTransport;
}

export interface MountedForm {
  readonly form: FormController;
  readonly host: HTMLElement;
  readonly registry: PrimitiveRegistry;
  readonly text: PrimitiveText;
  unmount(): void;
}

export interface PrimitiveFieldRenderContext {
  controlId: string;
  label: string;
  description?: string;
  errors: readonly string[];
  descriptionId?: string;
  errorId?: string;
  describedBy?: string;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
  readOnly: boolean;
}

export interface PrimitiveReportRenderContext {
  regionId: string;
  label: string;
  description?: string;
}

export interface PrimitiveExplanationRenderContext {
  regionId: string;
  label?: string;
  description?: string;
}

export interface PrimitiveFieldRendererElement extends HTMLElement {
  controller?: FieldController;
  descriptor?: FieldDescriptor | null;
  context?: PrimitiveFieldRenderContext;
  text?: PrimitiveText;
}

export interface PrimitiveReportRendererElement extends HTMLElement {
  controller?: ReportController;
  descriptor?: ReportDescriptor | null;
  context?: PrimitiveReportRenderContext;
  text?: PrimitiveText;
  transport?: PrimitiveReportTransport;
  request?: PrimitiveReportRequest | null;
}

export interface PrimitiveExplanationRendererElement extends HTMLElement {
  controller?: ExplanationController;
  descriptor?: ExplanationDescriptor | null;
  context?: PrimitiveExplanationRenderContext;
  text?: PrimitiveText;
}

export interface PrimitiveSubmitStartDetail {
  form: FormController;
  state: FormState;
}

export interface PrimitiveSubmitSuccessDetail {
  form: FormController;
  state: FormState;
  result: SubmitResult;
}

export interface PrimitiveSubmitErrorDetail {
  form: FormController;
  state: FormState;
  error: unknown;
  status: FormStatus;
}

export type { PrimitiveText, PrimitiveTextOverrides } from "./constants";
