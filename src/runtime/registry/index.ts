// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { createRegistry as createSchemaRegistry } from "@/schema";
import type { ExplanationDefinition, FieldDefinition, Registry, ReportDefinition } from "../types";

export const createRegistry = (): Registry => createSchemaRegistry();

export const defineFieldDefinition = <TConfig extends import("@/schema").FieldConfig, TValue>(
  definition: FieldDefinition<TConfig, TValue>,
): FieldDefinition<TConfig, TValue> => definition;

export const defineReportDefinition = <TConfig extends import("@/schema").ReportConfig>(
  definition: ReportDefinition<TConfig>,
): ReportDefinition<TConfig> => definition;

export const defineExplanationDefinition = <TConfig extends import("@/schema").ExplanationConfig>(
  definition: ExplanationDefinition<TConfig>,
): ExplanationDefinition<TConfig> => definition;
