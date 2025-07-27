import type { Infer } from "@/core";
import { FieldStrategy } from "@/extensions/app";
import { DateFieldSchema, FieldTypes } from "@/strategies/domain";
export class DateStrategy extends FieldStrategy<typeof DateFieldSchema> {
  constructor() {
    super(
      FieldTypes.DATE,
      DateFieldSchema,
      () => import("@/strategies/ui/date-field")
    );
  }

  buildControl(field: Infer<typeof DateFieldSchema>) {
    return {
      tag: "date-field",
      props: {
        min: field.min ? new Date(field.min).toISOString() : undefined,
        max: field.max ? new Date(field.max).toISOString() : undefined,
        step: field.step,
        defaultValue: field.value
          ? new Date(field.value).toISOString()
          : undefined,
      },
    };
  }
}
