// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { ExplanationConfig, NormalizedExplanationConfig } from "./explanation";
import type { FieldConfig, NormalizedFieldConfig } from "./field";
import type { NormalizedReportConfig, ReportConfig } from "./report";

export interface FormSchema {
  fields: FieldConfig[];
  reports?: ReportConfig[];
  explanations?: ExplanationConfig[];
}

export interface NormalizedFormSchema {
  fields: NormalizedFieldConfig[];
  reports: NormalizedReportConfig[];
  explanations: NormalizedExplanationConfig[];
}
