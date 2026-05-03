// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ExplanationConfig, ExplanationDefinition } from "./explanation";
import type { FieldConfig, FieldDefinition } from "./field";
import type { ReportConfig, ReportDefinition } from "./report";

export interface Registry {
  registerField<TConfig extends FieldConfig, TValue>(
    definition: FieldDefinition<TConfig, TValue>,
  ): Registry;
  unregisterField(kind: string): Registry;
  getField<TConfig extends FieldConfig = FieldConfig, TValue = unknown>(
    kind: string,
  ): FieldDefinition<TConfig, TValue> | undefined;
  listFields(): FieldDefinition<FieldConfig, unknown>[];
  registerReport<TConfig extends ReportConfig>(definition: ReportDefinition<TConfig>): Registry;
  unregisterReport(kind: string): Registry;
  getReport<TConfig extends ReportConfig = ReportConfig>(
    kind: string,
  ): ReportDefinition<TConfig> | undefined;
  listReports(): ReportDefinition<ReportConfig>[];
  registerExplanation<TConfig extends ExplanationConfig>(
    definition: ExplanationDefinition<TConfig>,
  ): Registry;
  unregisterExplanation(kind: string): Registry;
  getExplanation<TConfig extends ExplanationConfig = ExplanationConfig>(
    kind: string,
  ): ExplanationDefinition<TConfig> | undefined;
  listExplanations(): ExplanationDefinition<ExplanationConfig>[];
}
