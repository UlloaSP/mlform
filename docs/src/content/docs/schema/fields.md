---
title: Fields
description: Built-in field kinds and shared field options.
---

Built-in field kinds:

| Kind              | Value            | Options                                                                                                                      |
| ----------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `text`            | `string`         | `placeholder`, `minLength`, `maxLength`, `pattern`                                                                           |
| `number`          | `number \| null` | `min`, `max`, `step`, `unit`, `placeholder`                                                                                  |
| `boolean`         | `boolean`        | `required` requires `true`                                                                                                   |
| `category`        | `string \| null` | `options` as strings or `{ label, value }`                                                                                   |
| `mapped-category` | `string \| null` | `options` as `{ label, value, mapping }`. See [Mapped Category](/schema/mapped-category/).                                   |
| `date`            | `Date \| null`   | `min`, `max`, `step`                                                                                                         |
| `series`          | points array     | `minPoints`, `maxPoints`, `granularity`, `ordered`, `uniqueTimestamps`, `minDate`, `maxDate`, `minValue`, `maxValue`, `unit` |

Shared options:

```ts
{
  id: "email",
  kind: "text",
  label: "Email",
  description: "Used for notifications.",
  required: true,
  defaultValue: "",
  includeInSubmission: true,
  hiddenWhen: { kind: "field-value", field: "anonymous", equals: true },
  ui: { autocomplete: "email" }
}
```

Shared field options also include:

- `inactiveFieldPolicy`: Controls whether hidden/disabled fields are submitted.
- `includeInSubmission`: Set to `false` to keep a field out of `values`, `fieldValues`, `serializedValues`, and `serializedFieldValues`.
- `valuePath`: Writes the field into a nested payload path while keeping flat `fieldValues`.
