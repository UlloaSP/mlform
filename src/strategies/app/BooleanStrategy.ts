import type { Infer } from "@/core";
import { FieldStrategy } from "@/extensions";
import { BooleanFieldSchema, FieldTypes } from "@/strategies/domain";

export class BooleanStrategy extends FieldStrategy<typeof BooleanFieldSchema> {
  constructor() {
    super(
      FieldTypes.BOOLEAN,
      BooleanFieldSchema,
      () => import("@/strategies/ui/boolean-field")
    );
  }

  protected buildControl(field: Infer<typeof BooleanFieldSchema>) {
    return {
      tag: "boolean-field",
      props: {
        defaultValue:
          field.value !== undefined ? String(field.value) : undefined,
      },
    };
  }
}
