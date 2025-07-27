import type { Infer } from "@/core";
import { FieldStrategy } from "@/extensions/app";
import { CategoryFieldSchema, FieldTypes } from "@/strategies/domain";

export class CategoryStrategy extends FieldStrategy<
  typeof CategoryFieldSchema
> {
  constructor() {
    super(
      FieldTypes.CATEGORY,
      CategoryFieldSchema,
      () => import("@/strategies/ui/category-field")
    );
  }

  protected buildControl(field: Infer<typeof CategoryFieldSchema>) {
    return {
      tag: "category-field",
      props: {
        defaultValue: field.value ?? "",
        optionList: field.options,
      },
    };
  }
}
