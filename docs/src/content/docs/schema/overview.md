---
title: Schema Overview
description: The structure MLForm uses to describe fields, reports, conditions, and submission behavior.
---

A `FormSchema` describes what the form needs from the user and what the backend will return.

```ts
import type { FormSchema } from "mlform/schema";

const schema: FormSchema = {
  fields: [
    { id: "prompt", kind: "text", label: "Prompt", required: true },
    { id: "threshold", kind: "number", label: "Threshold", min: 0, max: 1 },
  ],
  reports: [{ id: "prediction", kind: "classifier", label: "Prediction" }],
};
```

## Main Types

| Type             | Purpose                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- |
| `FormSchema`     | Top-level object with `fields` and optional `reports`.                                  |
| `FieldConfig`    | One user input. Built-ins use `kind` values such as `text`, `number`, and `series`.     |
| `ReportConfig`   | One model output panel. Built-ins use `classifier` and `regressor`.                     |
| `FieldCondition` | Declarative or function-based rule for `hiddenWhen`, `disabledWhen`, or `readOnlyWhen`. |

## Normalization

MLForm normalizes every field and report before rendering:

- explicit `id` values are preserved
- missing field ids are generated from the field label when possible
- missing report ids are generated from the report label or kind
- duplicate explicit ids throw a registry/schema error

Use explicit ids in production. Generated ids are useful for demos, but stable ids make UI state, layout refs, focus, validation, tests, and analytics predictable. Backend payload keys belong in `mappedTo`. User-facing persistence, review, and export keys belong in `displayKey`; labels are copy and may change. Fields without `displayKey` are omitted from `displayValues`.

`getField(id)`, `getReport(id)`, layout refs, validation errors, and report states stay id-keyed because they are runtime APIs. For external contracts, use `getFieldByDisplayKey(key)`, `getFieldByMappedTo(target, { backend })`, submission `displayValues`, and submission `modelValues`.

## Shared Field Options

| Option                                       | Type                         | Notes                                            |
| -------------------------------------------- | ---------------------------- | ------------------------------------------------ |
| `id`                                         | `string`                     | Stable UI/schema identity. Recommended.          |
| `kind`                                       | `string`                     | Field kind resolved through the engine registry. |
| `label`                                      | `string`                     | User-facing label copy.                          |
| `displayKey`                                 | `string`                     | Stable display/review/export key.                |
| `description`                                | `string`                     | Help text rendered near the control.             |
| `required`                                   | `boolean`                    | Built-in validation.                             |
| `defaultValue`                               | `unknown`                    | Schema-level initial value.                      |
| `hidden`, `disabled`, `readOnly`             | `boolean`                    | Static inactive states.                          |
| `hiddenWhen`, `disabledWhen`, `readOnlyWhen` | `FieldCondition`             | Dynamic inactive states.                         |
| `mappedTo`                                   | `string \| number \| record` | Backend input key, position, or backend map.     |
| `ui`                                         | `Record<string, unknown>`    | Renderer-specific metadata.                      |

## Shared Report Options

| Option        | Type                      | Notes                                             |
| ------------- | ------------------------- | ------------------------------------------------- |
| `id`          | `string`                  | Stable UI/schema identity.                        |
| `kind`        | `string`                  | Report kind resolved through the engine registry. |
| `label`       | `string`                  | User-facing heading.                              |
| `description` | `string`                  | Help text for the report region.                  |
| `mappedTo`    | `string \| number \| record` | Backend output key, position, or backend map. |
| `ui`          | `Record<string, unknown>` | Renderer-specific metadata.                       |

## Related Pages

- [Fields](/mlform/schema/fields/)
- [OneHot Category](/mlform/schema/onehot-category/)
- [Reports](/mlform/schema/reports/)
- [Conditions](/mlform/schema/conditions/)
- [Initial Values](/mlform/schema/initial-values/)
