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
| `onehot-category` | `string \| null` | `options` as `{ label, value, mappedTo }`. Emits 0/1 one-hot columns. See [OneHot Category](/schema/onehot-category/).       |
| `date`            | `Date \| null`   | `min`, `max`, `step`                                                                                                         |
| `series`          | paired points    | `field1`, `field2`, `minPoints`, `maxPoints`; sub-fields support `text`, `number`, `date`, `category`, and `boolean`          |

Shared options:

```ts
{
  id: "email",
  kind: "text",
  label: "Email",
  description: "Used for notifications.",
  showDescriptionInline: true,
  required: true,
  defaultValue: "",
  includeInSubmission: true,
  mappedTo: "email",
  hiddenWhen: { kind: "field-value", field: "anonymous", equals: true },
  ui: { autocomplete: "email" }
}
```

Shared field options also include:

- `showDescriptionInline`: Shows `description` by default instead of waiting for the help button.
- `inactiveFieldPolicy`: Controls whether hidden/disabled fields are submitted.
- `includeInSubmission`: Set to `false` to keep a field out of `inputs`, `displayValues`, and `modelValues`.
- `mappedTo`: Writes the field to a backend feature name, numeric position, or backend-specific map.
- `valuePath`: Writes the field into a nested `modelValues` path.

Incoherent built-in constraints are schema errors, not value errors. Text length ranges and regular
expressions, numeric ranges, and date ranges are checked during schema normalization so invalid
forms fail before a runtime is created.

## Series fields

Each `series` point contains `field1` and `field2`. Their nested configurations use the same
constraints as the corresponding built-in kind: for example, text length and pattern constraints,
number ranges, date ranges and steps, and category options. Invalid nested configuration fails
during schema normalization. Nested values also use the built-in serialization contract, so dates
are emitted as full ISO timestamps just like top-level `date` fields.

`minPoints` and `maxPoints` control validation and the built-in editor. The editor disables row
removal at the minimum and row creation at the maximum. MLForm preserves the supplied point order
and duplicate values; sort or de-duplicate them before assigning the series when the backend
requires that contract.
