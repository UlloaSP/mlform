import type { Infer } from "@/core/domain";
import { FieldStrategy } from "@/extensions/app";
import { FieldTypes, TextFieldSchema } from "@/strategies/domain";

export class TextStrategy extends FieldStrategy<typeof TextFieldSchema> {
  constructor() {
    super(
      FieldTypes.TEXT,
      TextFieldSchema,
      () => import("@/strategies/ui/text-field")
    );
  }

  buildControl(field: Infer<typeof TextFieldSchema>) {
    return {
      tag: "text-field",
      props: {
        minlength: field.minLength,
        maxlength: field.maxLength,
        placeholder: field.placeholder,
        defaultValue: field.value,
        pattern: field.pattern,
      },
    };
  }
}
