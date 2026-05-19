// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { MLFormError } from "@/shared";
import type {
  FieldConfig,
  FieldDefinition,
  Registry,
  ReportConfig,
  ReportDefinition,
} from "./index";

export class RegistryError extends MLFormError {
  constructor(message: string) {
    super(message);
    this.name = "RegistryError";
  }
}

type StoredFieldDefinition = FieldDefinition<FieldConfig, unknown>;
type StoredReportDefinition = ReportDefinition<ReportConfig>;

class RegistryStore implements Registry {
  private readonly fieldDefinitions = new Map<string, StoredFieldDefinition>();
  private readonly reportDefinitions = new Map<string, StoredReportDefinition>();

  registerField<TConfig extends FieldConfig, TValue>(
    definition: FieldDefinition<TConfig, TValue>,
  ): Registry {
    if (this.fieldDefinitions.has(definition.kind)) {
      throw new RegistryError(`Field kind "${definition.kind}" is already registered.`);
    }

    this.fieldDefinitions.set(definition.kind, definition as unknown as StoredFieldDefinition);
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

    this.reportDefinitions.set(definition.kind, definition as unknown as StoredReportDefinition);
    return this;
  }

  unregisterReport(kind: string): Registry {
    this.reportDefinitions.delete(kind);
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

  listFields(): FieldDefinition<FieldConfig, unknown>[] {
    return Array.from(this.fieldDefinitions.values()) as FieldDefinition<FieldConfig, unknown>[];
  }

  listReports(): ReportDefinition<ReportConfig>[] {
    return Array.from(this.reportDefinitions.values()) as ReportDefinition<ReportConfig>[];
  }
}

export const createRegistry = (): Registry => new RegistryStore();

export const defineFieldDefinition = <TDefinition extends FieldDefinition<FieldConfig, unknown>>(
  definition: TDefinition,
): TDefinition => definition;

export const defineReportDefinition = <TDefinition extends ReportDefinition<ReportConfig>>(
  definition: TDefinition,
): TDefinition => definition;
