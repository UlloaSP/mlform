// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  ExplanationDefinition,
  FieldDefinition,
  Registry as SchemaRegistry,
  ReportDefinition,
} from "@/schema";

export interface Registry extends Omit<
  SchemaRegistry,
  "registerExplanation" | "registerField" | "registerReport"
> {
  registerField(definition: FieldDefinition): Registry;
  registerReport(definition: ReportDefinition): Registry;
  registerExplanation(definition: ExplanationDefinition): Registry;
}
