// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { Registry } from "@/schema";
import type { DefinedFieldKind, DefinedReportKind } from "./index";
import type { PrimitiveDescriptorRegistry } from "@/primitives";

export const registerDefinedFieldKind = <TConfig extends import("@/schema").FieldConfig, TValue>(
  registry: Registry,
  descriptorRegistry: PrimitiveDescriptorRegistry,
  kind: DefinedFieldKind<TConfig, TValue>,
): void => {
  registry.registerField(kind.definition);
  descriptorRegistry.registerField(kind.presenter);
};

export const registerDefinedReportKind = <TConfig extends import("@/schema").ReportConfig>(
  registry: Registry,
  descriptorRegistry: PrimitiveDescriptorRegistry,
  kind: DefinedReportKind<TConfig, unknown>,
): void => {
  registry.registerReport(kind.definition);
  descriptorRegistry.registerReport(kind.presenter);
};
