import { array, never, union, type Schema } from "@/core/domain";
import { DescriptorStrategy } from "./DescriptorStrategy";

export class DescriptorRegistry {
  private readonly catalog = new Map<string, DescriptorStrategy>();
  private combinedSchema: Schema = never();

  register(item: DescriptorStrategy): void {
    if (this.catalog.has(item.type)) {
      throw new Error(`[Registry] El tipo «${item.type}» ya existe.`);
    }
    this.catalog.set(item.type, item);
    this.rebuildSchema();
  }

  unregister(type: string): void {
    if (!this.catalog.delete(type)) {
      throw new Error(`[Registry] El tipo «${type}» no existe.`);
    }
    this.rebuildSchema();
  }

  update(item: DescriptorStrategy): void {
    if (!this.catalog.has(item.type)) {
      throw new Error(`[Registry] El tipo «${item.type}» no existe.`);
    }
    this.catalog.set(item.type, item);
    this.rebuildSchema();
  }

  get(type: string): DescriptorStrategy | undefined {
    return this.catalog.get(type);
  }
  values(): IterableIterator<DescriptorStrategy> {
    return this.catalog.values();
  }

  get schema(): Schema {
    return array(this.combinedSchema);
  }

  private rebuildSchema(): void {
    const schemas = Array.from(this.catalog.values()).map((i) => i.schema);
    this.combinedSchema =
      schemas.length === 0
        ? never()
        : schemas.length === 1
          ? schemas[0]
          : union(schemas as [Schema, Schema, ...Schema[]]);
  }
}
