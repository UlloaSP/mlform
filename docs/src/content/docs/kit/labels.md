---
title: Labels and text
description: Change the words the mounted form uses, from the submit button to field status messages, and know which messages are fixed.
---

Field and report copy comes from the schema (`label`, `description`, option labels). Everything
else the built-in UI says comes from two options of `mountForm`: `labels` for the layout shell and
`primitiveText` for the controls inside it.

## Shell labels

```ts
mountForm(container, {
  schema,
  transport,
  labels: {
    form: "Station inputs",
    reports: "Forecast",
    submit: "Run forecast",
    validating: "Checking…",
    submitting: "Forecasting…",
    prev: "Back",
    next: "Continue",
    step: "Step",
    stepLabel: (current, total) => `Step ${current} of ${total}`,
    tabs: "Form sections",
    sectionsOpen: (count) => `${count} open`,
  },
});
```

| Label | Default | Used for |
| --- | --- | --- |
| `form` | `"Inputs"` | Accessible name and heading of the input area. |
| `reports` | `"Reports"` | Accessible name and heading of the report area. |
| `submit` | `"Submit"` | Submit button. |
| `validating`, `submitting` | `"Validating..."`, `"Submitting..."` | Submit button while busy. |
| `prev`, `next` | `"Previous"`, `"Next"` | Wizard and tabs navigation. |
| `step` | `"Step"` | Wizard progress eyebrow. |
| `stepLabel` | `` `Step ${current} of ${total}` `` | Wizard progress announcement. |
| `tabs` | `"Form sections"` | Accessible name of the tab list. |
| `sectionsOpen` | `` `${count} sections open` `` | Footer summary in layouts with sections. |

`defaultKitLabels` from `mlform` holds the defaults if you want to extend them.

## Control text

`primitiveText` overrides strings rendered by the built-in controls: placeholders, success
messages, series buttons, report states, and the help button.

```ts
mountForm(container, {
  schema,
  transport,
  primitiveText: {
    categoryPlaceholder: "Choose…",
    seriesAddRow: "Add reading",
    seriesRemoveRow: "Remove reading",
    fieldValidNumber: (value, unit) => `${value}${unit} accepted.`,
    reportStateTitle: (status) => (status === "idle" ? "Run the forecast to see this" : "Forecast"),
  },
});
```

The full list, with defaults, is `primitiveStaticText` in `mlform/primitives`; its type is
`PrimitiveText`, and every key is optional in `primitiveText`.

## Localization

Pass translated `labels`, `primitiveText`, and schema copy together. API names (`kind`, `fields`,
`mountForm`) stay in English.

The validation messages of built-in kinds, such as `This field is required.` and
`Maximum value is 100.`, are fixed English strings in this version; neither option changes them.
When a form must be fully translated, add a [form validator](/guides/validation/#cross-field-rules)
or custom kind that returns your own messages for the rules that matter, and keep the built-in
constraint off for those fields.
