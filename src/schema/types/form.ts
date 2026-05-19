// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FieldConfig, NormalizedFieldConfig } from "./field";
import type { NormalizedReportConfig, ReportConfig } from "./report";

export interface FormSchema {
  fields: FieldConfig[];
  reports?: ReportConfig[];
}

export interface NormalizedFormSchema {
  fields: NormalizedFieldConfig[];
  reports: NormalizedReportConfig[];
}
