import type { Infer, Schema } from "@/core";
import { type DescriptorItem, DescriptorStrategy } from "@/core/app";
export abstract class ReportStrategy<
  S extends Schema = Schema,
> extends DescriptorStrategy<S> {
  protected abstract buildControl(field: Infer<S>): {
    tag: string;
    props: Record<string, unknown>;
  };

  buildDescriptor(field: Infer<S>): DescriptorItem {
    return {
      ...this.buildControl(field),
      slot: "report",
    };
  }
}
