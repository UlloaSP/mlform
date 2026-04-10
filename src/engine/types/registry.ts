// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FieldConfig, FieldDefinition } from "./field";
import type { ReportConfig, ReportDefinition } from "./report";

export interface Registry {
  registerField<TConfig extends FieldConfig, TValue>(
    definition: FieldDefinition<TConfig, TValue>,
  ): Registry;
  registerReport<TConfig extends ReportConfig>(definition: ReportDefinition<TConfig>): Registry;
  getField<TConfig extends FieldConfig = FieldConfig, TValue = unknown>(
    kind: string,
  ): FieldDefinition<TConfig, TValue> | undefined;
  getReport<TConfig extends ReportConfig = ReportConfig>(
    kind: string,
  ): ReportDefinition<TConfig> | undefined;
  listFields(): FieldDefinition<FieldConfig, unknown>[];
  listReports(): ReportDefinition<ReportConfig>[];
}
