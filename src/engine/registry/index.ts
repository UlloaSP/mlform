// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { RegistryError } from "../errors";
import type {
  ExplanationConfig,
  ExplanationDefinition,
  FieldConfig,
  FieldDefinition,
  Registry,
  ReportConfig,
  ReportDefinition,
} from "../types";

type StoredFieldDefinition = FieldDefinition<any, any>;
type StoredReportDefinition = ReportDefinition<any>;
type StoredExplanationDefinition = ExplanationDefinition<any>;

export class EngineRegistry implements Registry {
  private readonly fieldDefinitions = new Map<string, StoredFieldDefinition>();
  private readonly reportDefinitions = new Map<string, StoredReportDefinition>();
  private readonly explanationDefinitions = new Map<string, StoredExplanationDefinition>();

  registerField<TConfig extends FieldConfig, TValue>(
    definition: FieldDefinition<TConfig, TValue>,
  ): Registry {
    if (this.fieldDefinitions.has(definition.kind)) {
      throw new RegistryError(`Field kind "${definition.kind}" is already registered.`);
    }

    this.fieldDefinitions.set(definition.kind, definition as StoredFieldDefinition);
    return this;
  }

  unregisterField(kind: string): Registry {
    this.fieldDefinitions.delete(kind);
    return this;
  }

  registerReport<TConfig extends ReportConfig>(definition: ReportDefinition<TConfig>): Registry {
    if (this.reportDefinitions.has(definition.kind)) {
      throw new RegistryError(`Report kind "${definition.kind}" is already registered.`);
    }

    this.reportDefinitions.set(definition.kind, definition as StoredReportDefinition);
    return this;
  }

  unregisterReport(kind: string): Registry {
    this.reportDefinitions.delete(kind);
    return this;
  }

  registerExplanation<TConfig extends ExplanationConfig>(
    definition: ExplanationDefinition<TConfig>,
  ): Registry {
    if (this.explanationDefinitions.has(definition.kind)) {
      throw new RegistryError(`Explanation kind "${definition.kind}" is already registered.`);
    }

    this.explanationDefinitions.set(definition.kind, definition as StoredExplanationDefinition);
    return this;
  }

  unregisterExplanation(kind: string): Registry {
    this.explanationDefinitions.delete(kind);
    return this;
  }

  getField<TConfig extends FieldConfig = FieldConfig, TValue = unknown>(
    kind: string,
  ): FieldDefinition<TConfig, TValue> | undefined {
    return this.fieldDefinitions.get(kind) as FieldDefinition<TConfig, TValue> | undefined;
  }

  getReport<TConfig extends ReportConfig = ReportConfig>(
    kind: string,
  ): ReportDefinition<TConfig> | undefined {
    return this.reportDefinitions.get(kind) as ReportDefinition<TConfig> | undefined;
  }

  getExplanation<TConfig extends ExplanationConfig = ExplanationConfig>(
    kind: string,
  ): ExplanationDefinition<TConfig> | undefined {
    return this.explanationDefinitions.get(kind) as ExplanationDefinition<TConfig> | undefined;
  }

  listFields(): FieldDefinition<FieldConfig, unknown>[] {
    return Array.from(this.fieldDefinitions.values()) as FieldDefinition<FieldConfig, unknown>[];
  }

  listReports(): ReportDefinition<ReportConfig>[] {
    return Array.from(this.reportDefinitions.values()) as ReportDefinition<ReportConfig>[];
  }

  listExplanations(): ExplanationDefinition<ExplanationConfig>[] {
    return Array.from(
      this.explanationDefinitions.values(),
    ) as ExplanationDefinition<ExplanationConfig>[];
  }
}

export const createRegistry = (): Registry => new EngineRegistry();

export const defineFieldDefinition = <TConfig extends FieldConfig, TValue>(
  definition: FieldDefinition<TConfig, TValue>,
): FieldDefinition<TConfig, TValue> => definition;

export const defineReportDefinition = <TConfig extends ReportConfig>(
  definition: ReportDefinition<TConfig>,
): ReportDefinition<TConfig> => definition;

export const defineExplanationDefinition = <TConfig extends ExplanationConfig>(
  definition: ExplanationDefinition<TConfig>,
): ExplanationDefinition<TConfig> => definition;
