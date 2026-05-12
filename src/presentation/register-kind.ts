// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { Registry } from "@/schema";
import type { DefinedExplanationKind, DefinedFieldKind, DefinedReportKind } from "./index";
import type { PresentationRegistry } from "./registry";

export const registerDefinedFieldKind = <TConfig extends import("@/schema").FieldConfig, TValue>(
  registry: Registry,
  presentationRegistry: PresentationRegistry,
  kind: DefinedFieldKind<TConfig, TValue>,
): void => {
  registry.registerField(kind.definition);
  presentationRegistry.registerField(kind.presenter);
};

export const registerDefinedReportKind = <TConfig extends import("@/schema").ReportConfig>(
  registry: Registry,
  presentationRegistry: PresentationRegistry,
  kind: DefinedReportKind<TConfig, unknown>,
): void => {
  registry.registerReport(kind.definition);
  presentationRegistry.registerReport(kind.presenter);
};

export const registerDefinedExplanationKind = <
  TConfig extends import("@/schema").ExplanationConfig,
>(
  registry: Registry,
  presentationRegistry: PresentationRegistry,
  kind: DefinedExplanationKind<TConfig, unknown>,
): void => {
  registry.registerExplanation(kind.definition);
  presentationRegistry.registerExplanation(kind.presenter);
};
