import type { FieldConfig, FormSchema } from "mlform/schema";
import type { OneHotCategoryOption } from "mlform/builtins";
import { SERIES_SCHEMA } from "./series-schema.ts";
import { BASIC_FIELD_CASES } from "./field-cases/basic.ts";
import { COMMON_FIELD_CASES } from "./field-cases/common.ts";
import { CONSTRAINT_CASES, FIELD_CASE_VALUES } from "./field-cases/constraints.ts";
import { SERIES_CASES } from "./field-cases/series.ts";

export { FIELD_CASE_VALUES };
export const FIELD_COMBINATIONS_SCHEMA: FormSchema = {
  fields: [
    ...SERIES_SCHEMA.fields,
    ...BASIC_FIELD_CASES.fields,
    ...COMMON_FIELD_CASES,
    ...CONSTRAINT_CASES,
    ...SERIES_CASES,
  ].map((field: FieldConfig) =>
    field.kind === "onehot-category"
      ? {
          ...field,
          options: (field.options as OneHotCategoryOption[]).map((option) => ({
            ...option,
            mappedTo: `${field.id}-${option.value}`,
          })),
        }
      : field,
  ),
  reports: [],
};
