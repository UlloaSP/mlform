---
title: Fields
description: Built-in field kinds and shared field options.
---

Built-in field kinds:

| Kind              | Value            | Options                                                                                                                      |
| ----------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `text`            | `string`         | `placeholder`, `minLength`, `maxLength`, `pattern`                                                                           |
| `number`          | `number \| string \| null` | `min`, `max`, `step`, `unit`, `placeholder`; invalid drafts remain strings until corrected |
| `boolean`         | `boolean \| null` | `required` requires an explicit choice; both `true` and `false` are valid |
| `category`        | `string \| null` | `options` as strings or `{ label, value }`                                                                                   |
| `mapped-category` | `string \| null` | `options` as `{ label, value, mapping }`. See [Mapped Category](/schema/mapped-category/).                                   |
| `onehot-category` | `string \| null` | `options` as `{ label, value, mappedTo }`. Emits 0/1 one-hot columns. See [OneHot Category](/schema/onehot-category/).       |
| `date`            | `Date \| null`   | `min`, `max`, `step`                                                                                                         |
| `series`          | named row values | `columns` (one or more columns with unique `id`), `minPoints`, `maxPoints`, `aggregations`, `showAggregationSummary` (default `false`); see [Series](/examples/series/) |

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

Submission paths reject `__proto__`, `prototype`, and `constructor` segments to keep backend
payload construction confined to its own object.

Incoherent built-in constraints are schema errors, not value errors. Text length ranges and regular
expressions, numeric ranges, and date ranges are checked during schema normalization so invalid
forms fail before a runtime is created.

## Numeric editing

Number fields and numeric Series cells share one normalization and validation rule. Empty input
becomes `null`. Decimal text may use a dot or a single comma as its decimal separator, with an
optional exponent such as `1e-8`. Grouping separators, hexadecimal and binary notation are not
accepted. Non-numeric values and incomplete drafts such as `-` remain invalid instead of being
silently coerced to a number or treated as empty.

The built-in editors preserve the text you type, including trailing zeros, small decimal values
and the caret position. Editing does not rewrite a decimal as scientific notation. Arrow keys
still step numeric controls according to their configured constraints. Runtime values and submitted
payloads contain normalized numbers; the literal spelling is editor state.

Non-finite numbers, overflow, non-zero values that underflow to zero, and plain integer strings
that would be rounded to a different integer fail validation. MLForm uses JavaScript numbers,
not arbitrary-precision arithmetic; accepted decimal and exponent values retain that precision
limit. Invalid numeric drafts block submission and survive draft snapshots.

An optional bounded number with a numeric `defaultValue` uses a range slider automatically.
The choice is stable while editing. Use `ui: { input: "number" }` or `ui: { input: "range" }`
to choose explicitly.

## Series fields

Each `series` point is an object keyed by the ids declared in `columns`. There is no fixed
column count. Column configurations use the same
constraints as the corresponding built-in kind: for example, text length and pattern constraints,
number ranges, date ranges and steps, and category options. Invalid nested configuration fails
during schema normalization. Nested values also use the built-in serialization contract, so dates
are emitted as full ISO timestamps just like top-level `date` fields.

`minPoints` and `maxPoints` control validation and the built-in editor. The editor disables row
removal at the minimum and row creation at the maximum. MLForm preserves the supplied point order
and duplicate values; sort or de-duplicate them before assigning the series when the backend
requires that contract.

The built-in editor marks the invalid cells and keeps row-level messages in the field feedback.
For a custom editor, `getSeriesCellErrors(value, config)` from `mlform/builtins` returns one record
per row, keyed by column id, with that cell's validation messages. It uses the same constraints as
runtime Series validation, including finite observations required by aggregations.

Use `aggregations` to turn numeric observations into multiple backend features without adding
editable derived fields. Each aggregate declares its numeric `source`, `operation`, `label`, and
`mappedTo`. The runtime preserves the original series and computes the model values from it;
the built-in editor shows only the observations by default. Set `showAggregationSummary: true`
to show the calculated results. Each aggregate's `source` identifies a declared numeric column.
See [Series](/examples/series/) for the
statistical and missing-value contract.
