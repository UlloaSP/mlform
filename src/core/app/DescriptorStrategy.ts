import type { Infer, Schema } from "@/core/domain";
import type { DescriptorItem } from "./DescriptorItem";

const ERROR_TYPE_EMPTY: string = "[DescriptorStrategy] Type cannot be empty.";

export abstract class DescriptorStrategy<S extends Schema = Schema> {
  constructor(
    readonly type: string,
    readonly schema: S,
    readonly loader: () => Promise<unknown>
  ) {
    if (!type.trim()) throw new Error(ERROR_TYPE_EMPTY);
    Object.freeze(this);
  }

  abstract buildDescriptor(payload: Record<string, unknown>): DescriptorItem;

  validate(data: S): boolean {
    return this.schema.safeParse(data).success;
  }
  parse(data: S): Infer<S> {
    return this.schema.parse(data);
  }
}
