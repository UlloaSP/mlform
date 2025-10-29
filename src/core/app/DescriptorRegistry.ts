// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { array, type Schema, union } from "@/core/domain";
import { DescriptorStrategy } from "./DescriptorStrategy";

const ERROR_TYPE_ALREADY_EXISTS: string =
  "[Registry] The type «{type}» already exists.";
const ERROR_TYPE_DOES_NOT_EXIST: string =
  "[Registry] The type «{type}» does not exist.";

export class DescriptorRegistry {
  private readonly catalog = new Map<string, DescriptorStrategy>();
  private combinedSchema: Schema = union([]);

  get schema(): Schema {
    return array(this.combinedSchema);
  }

  get(type: string): DescriptorStrategy | undefined {
    return this.catalog.get(type);
  }

  values(): IterableIterator<DescriptorStrategy> {
    return this.catalog.values();
  }

  register(item: DescriptorStrategy): void {
    if (this.catalog.has(item.type)) {
      throw new Error(ERROR_TYPE_ALREADY_EXISTS.replace("{type}", item.type));
    }
    this.catalog.set(item.type, item);
    this.rebuildSchema();
  }

  unregister(type: string): void {
    if (!this.catalog.delete(type)) {
      throw new Error(ERROR_TYPE_DOES_NOT_EXIST.replace("{type}", type));
    }
    this.rebuildSchema();
  }

  update(item: DescriptorStrategy): void {
    if (!this.catalog.has(item.type)) {
      throw new Error(ERROR_TYPE_DOES_NOT_EXIST.replace("{type}", item.type));
    }
    this.catalog.set(item.type, item);
    this.rebuildSchema();
  }

  private rebuildSchema(): void {
    const schemas = Array.from(this.catalog.values()).map((i) => i.schema);
    this.combinedSchema = union(schemas);
  }
}
