// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import "./register";

export { PrimitiveExplanationElement } from "./base-explanation-element";
export { PrimitiveFieldElement } from "./base-field-element";
export { PrimitiveAsyncReportElement } from "./base-async-report-element";
export { PrimitiveReportElement } from "./base-report-element";
export { mountForm, unmountForm } from "./mount-form";
export { createBuiltinPrimitiveRegistry, createPrimitiveRegistry } from "./registry";
export { primitiveDefaultLabels, primitiveStaticText, resolvePrimitiveText } from "./constants";
export type {
  PrimitiveContainerStrategy,
  ExplanationRequest,
  ExplanationTransport,
  MountedForm,
  MountFormOptions,
  PrimitiveExplanationRenderContext,
  PrimitiveExplanationRendererElement,
  PrimitiveLayout,
  PrimitiveRegistry,
  PrimitiveText,
  PrimitiveTextOverrides,
  PrimitiveFieldRenderContext,
  PrimitiveReportRenderContext,
  PrimitiveFieldRendererElement,
  PrimitiveReportRendererElement,
  PrimitiveSubmitStartDetail,
  PrimitiveSubmitSuccessDetail,
  PrimitiveSubmitErrorDetail,
  PrimitiveReportRequest,
  PrimitiveReportTransport,
} from "./types";
