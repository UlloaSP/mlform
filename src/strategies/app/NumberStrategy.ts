import type { Infer } from "@/core/domain";
import { FieldStrategy } from "@/extensions/app";
import { FieldTypes, NumberFieldSchema } from "@/strategies/domain";

export class NumberStrategy extends FieldStrategy<typeof NumberFieldSchema> {
  constructor() {
    super(FieldTypes.NUMBER, NumberFieldSchema, async () => {
      await Promise.resolve();
      import("@/strategies/ui/range-field");
      import("@/strategies/ui/number-field");
    });
  }

  buildControl(field: Infer<typeof NumberFieldSchema>) {
    const isRange =
      field.min != null &&
      field.max != null &&
      !field.required &&
      field.value != null;

    return isRange
      ? {
          tag: "range-field",
          props: {
            unit: field.unit,
            min: field.min,
            max: field.max,
            step: field.step,
            defaultValue: field.value,
          },
          slot: "inputs",
        }
      : {
          tag: "number-field",
          props: {
            unit: field.unit,
            min: field.min,
            max: field.max,
            step: field.step,
            defaultValue: field.value,
            placeholder: field.placeholder,
          },
        };
  }
}
