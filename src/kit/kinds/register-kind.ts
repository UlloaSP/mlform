// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { Registry } from "@/schema";
import type { PrimitiveDescriptorRegistry } from "@/primitives";
import type { DefinedFieldKind } from "./define-field-kind";
import type { DefinedReportKind } from "./define-report-kind";

export const registerDefinedFieldKind = <TConfig extends import("@/schema").FieldConfig, TValue>(
  registry: Registry,
  descriptorRegistry: PrimitiveDescriptorRegistry,
  kind: DefinedFieldKind<TConfig, TValue>,
): void => {
  kind.register(registry, descriptorRegistry);
};

export const registerDefinedReportKind = <TConfig extends import("@/schema").ReportConfig>(
  registry: Registry,
  descriptorRegistry: PrimitiveDescriptorRegistry,
  kind: DefinedReportKind<TConfig, unknown>,
): void => {
  kind.register(registry, descriptorRegistry);
};
