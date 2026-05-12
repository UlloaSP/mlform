// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export type MaybePromise<T> = T | PromiseLike<T>;

export * from "./behavior";
export * from "./explanation";
export * from "./field";
export * from "./form";
export * from "./pipeline";
export * from "./report";
export * from "./transport";
export type {
  DeclarativeExplanationKind,
  DeclarativeFieldKind,
  DeclarativeReportKind,
  ExplanationDescriptor,
  ExplanationDescriptorContext,
  ExplanationPresenter,
  ExplanationRenderSpec,
  ExplanationRenderSpecContext,
  FieldDescriptor,
  FieldPresenter,
  FieldRenderHints,
  FieldRenderSpec,
  FieldRenderSpecContext,
  FieldWidget,
  PresentationContent,
  PresentationNode,
  PresentationSummary,
  PresentationTone,
  ReportDescriptor,
  ReportPresenter,
  ReportRenderSpec,
  ReportRenderSpecContext,
} from "@/presentation";
