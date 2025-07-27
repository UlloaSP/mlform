import { type DescriptorItem, DescriptorStrategy } from "@/core/app";
import type { Infer, Schema } from "@/core/domain";
export abstract class FieldStrategy<
  S extends Schema = Schema,
> extends DescriptorStrategy<S> {
  private static readonly FIELD_SLOT = "inputs";

  protected abstract buildControl(field: Infer<S>): {
    tag: string;
    props: Record<string, unknown>;
  };

  // @ts-ignore
  buildDescriptor(field: Infer<S>): DescriptorItem {
    const control: DescriptorItem = {
      ...this.buildControl(field),
      slot: FieldStrategy.FIELD_SLOT,
    };

    return {
      tag: "field-wrapper",
      props: {
        // @ts-ignore
        title: field.title,
        // @ts-ignore
        description: field.description ?? "",
      },
      child: control,
      slot: FieldStrategy.FIELD_SLOT,
    };
  }
}
