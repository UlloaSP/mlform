// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import "./register";

export { PrimitiveFieldElement } from "./base-field-element";
export { PrimitiveReportElement } from "./base-report-element";
export { mountForm, unmountForm } from "./mount-form";
export { createBuiltinPrimitiveRegistry, createPrimitiveRegistry } from "./registry";
export { primitiveDefaultLabels, primitiveStaticText, resolvePrimitiveText } from "./constants";
export type {
  MountedForm,
  MountFormOptions,
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
} from "./types";
