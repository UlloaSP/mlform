// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  FieldController,
  FieldDescriptor,
  FormController,
  FormState,
  FormStatus,
  ReportController,
  ReportDescriptor,
  SubmitResult,
} from "@/engine";

export type PrimitiveLayout = "stacked" | "split";

export interface PrimitiveRegistry {
  registerField(component: string, tagName: string): PrimitiveRegistry;
  registerReport(component: string, tagName: string): PrimitiveRegistry;
  resolveField(component: string): string | undefined;
  resolveReport(component: string): string | undefined;
  clone(): PrimitiveRegistry;
}

export interface MountFormOptions {
  registry?: PrimitiveRegistry;
  layout?: PrimitiveLayout;
  formLabel?: string;
  reportsLabel?: string;
  submitLabel?: string;
  validatingLabel?: string;
  submittingLabel?: string;
  reportPane?: "auto" | "always" | "hidden";
}

export interface MountedForm {
  readonly form: FormController;
  readonly host: HTMLElement;
  readonly registry: PrimitiveRegistry;
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
  controller?: FieldController;
  descriptor?: FieldDescriptor | null;
  context?: PrimitiveFieldRenderContext;
}

export interface PrimitiveReportRendererElement extends HTMLElement {
  controller?: ReportController;
  descriptor?: ReportDescriptor | null;
  context?: PrimitiveReportRenderContext;
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
