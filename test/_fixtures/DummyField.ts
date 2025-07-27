import { z } from "zod";
import type { DescriptorItem } from "@/core/app/DescriptorItem";

export class DummyField {
  public readonly type: string;
  public readonly schema: z.ZodString;
  public readonly comment: string;

  constructor(
    type = "dummy",
    schema = z.string(),
    comment = "/* módulo de prueba */"
  ) {
    this.type = type;
    this.schema = schema;
    this.comment = comment;
  }

  buildDescriptor(payload: Record<string, unknown>): DescriptorItem {
    return {
      tag: "dummy-component",
      props: payload,
      slot: "inputs",
    };
  }
}
