// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { RegistryError } from "./errors";
import type { FieldDefinition, Registry, ReportDefinition } from "./types";

export class EngineRegistry implements Registry {
  private readonly fieldDefinitions = new Map<string, FieldDefinition<any, any>>();
  private readonly reportDefinitions = new Map<string, ReportDefinition<any>>();

  registerField(definition: FieldDefinition<any, any>): Registry {
    if (this.fieldDefinitions.has(definition.kind)) {
      throw new RegistryError(`Field kind "${definition.kind}" is already registered.`);
    }

    this.fieldDefinitions.set(definition.kind, definition);
    return this;
  }

  registerReport(definition: ReportDefinition<any>): Registry {
    if (this.reportDefinitions.has(definition.kind)) {
      throw new RegistryError(`Report kind "${definition.kind}" is already registered.`);
    }

    this.reportDefinitions.set(definition.kind, definition);
    return this;
  }

  getField(kind: string): FieldDefinition<any, any> | undefined {
    return this.fieldDefinitions.get(kind);
  }

  getReport(kind: string): ReportDefinition<any> | undefined {
    return this.reportDefinitions.get(kind);
  }

  listFields(): FieldDefinition<any, any>[] {
    return Array.from(this.fieldDefinitions.values());
  }

  listReports(): ReportDefinition<any>[] {
    return Array.from(this.reportDefinitions.values());
  }
}

export const createRegistry = (): Registry => new EngineRegistry();
