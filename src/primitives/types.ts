// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  PrimitiveFieldController,
  PrimitiveFormController,
  PrimitiveFormStatus,
  PrimitiveReportRequest,
  PrimitiveReportController,
  PrimitiveSubmitResult,
  PrimitiveFormState,
} from "./controller-types";
import type { PrimitiveText, PrimitiveTextOverrides } from "./constants";
import type { FieldDescriptor, PrimitiveDescriptorRegistry, ReportDescriptor } from "./descriptors";

export type PrimitiveLayout = "stacked" | "split";
export type PrimitiveContainerStrategy = "error" | "replace";

export type { PrimitiveReportRequest };

export interface PrimitiveRegistry {
  // --- Fields ---
  registerField(component: string, tagName: string): PrimitiveRegistry;
  unregisterField(component: string): PrimitiveRegistry;
  resolveField(component: string): string | undefined;

  // --- Reports ---
  registerReport(component: string, tagName: string): PrimitiveRegistry;
  unregisterReport(component: string): PrimitiveRegistry;
  resolveReport(component: string): string | undefined;

  clone(): PrimitiveRegistry;
}

/**
 * Transport for fetching post-submit report content.
 * Receives the full submit result + report context; may return any value.
 * Renderers decide how to display loading, success, and error states.
 */
export interface PrimitiveReportTransport {
  submit: (request: PrimitiveReportRequest) => Promise<unknown>;
}

export interface MountFormOptions {
  registry?: PrimitiveRegistry;
  descriptorRegistry?: PrimitiveDescriptorRegistry;
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
  readonly form: PrimitiveFormController;
  readonly host: HTMLElement;
  readonly registry: PrimitiveRegistry;
  readonly descriptorRegistry: PrimitiveDescriptorRegistry;
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

export interface PrimitiveFieldRendererElement extends HTMLElement {
  controller?: PrimitiveFieldController;
  descriptor?: FieldDescriptor | null;
  context?: PrimitiveFieldRenderContext;
  text?: PrimitiveText;
}

export interface PrimitiveReportRendererElement extends HTMLElement {
  controller?: PrimitiveReportController;
  descriptor?: ReportDescriptor | null;
  context?: PrimitiveReportRenderContext;
  text?: PrimitiveText;
  transport?: PrimitiveReportTransport;
  request?: PrimitiveReportRequest | null;
}

export interface PrimitiveSubmitStartDetail {
  form: PrimitiveFormController;
  state: PrimitiveFormState;
}

export interface PrimitiveSubmitSuccessDetail {
  form: PrimitiveFormController;
  state: PrimitiveFormState;
  result: PrimitiveSubmitResult;
}

export interface PrimitiveSubmitErrorDetail {
  form: PrimitiveFormController;
  state: PrimitiveFormState;
  error: unknown;
  status: PrimitiveFormStatus;
}

export type { PrimitiveText, PrimitiveTextOverrides } from "./constants";
