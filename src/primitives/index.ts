// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

export { PrimitiveFieldElement } from "./base-field-element";
export { PrimitiveAsyncReportElement } from "./base-async-report-element";
export { PrimitiveReportElement } from "./base-report-element";
export { PrimitiveFormElement } from "./components/form-root";
export { mountForm, unmountForm } from "./mount-form";
export { focusPrimitiveField } from "./components/error-focus";
export { createBuiltinPrimitiveRegistry, createPrimitiveRegistry } from "./registry";
export { createPrimitiveDescriptorRegistry, PrimitiveDescriptorRegistry } from "./descriptors";
export { toDescriptorNodes } from "./descriptors";
export {
  primitiveDefaultLabels,
  primitiveStaticText,
  primitiveTagNames,
  resolvePrimitiveText,
} from "./constants";
export type {
  PrimitiveContainerStrategy,
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
  PrimitiveReportRequest,
  PrimitiveReportTransport,
} from "./types";
export type * from "./controller-types";
export type * from "./descriptors";
