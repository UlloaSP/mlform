import type { FieldConfig } from "mlform/schema";

const choices = ["small", "medium", "large"];
export const FIELD_BASES: FieldConfig[] = [
  { kind: "text", label: "Text", defaultValue: "Hello", placeholder: "Enter text" },
  { kind: "long-text", label: "Long text", defaultValue: "First line\nSecond line", rows: 3 },
  { kind: "number", label: "Number", defaultValue: 12.5, unit: "kg" },
  { kind: "boolean", label: "Boolean", defaultValue: true },
  { kind: "category", label: "Category", defaultValue: "medium", options: choices },
  { kind: "single-choice", label: "Single choice", defaultValue: "medium", options: choices },
  {
    kind: "multi-choice",
    label: "Multi choice",
    defaultValue: ["small", "large"],
    options: choices,
  },
  { kind: "rating", label: "Rating", defaultValue: 3, max: 5 },
  { kind: "date", label: "Date", defaultValue: "2026-06-15" },
  {
    kind: "mapped-category",
    label: "Mapped category",
    defaultValue: "small",
    options: [
      { label: "Small · 10", value: "small", mapping: { "mapping-target": 10 } },
      { label: "Large · 20", value: "large", mapping: { "mapping-target": 20 } },
    ],
  },
  {
    kind: "onehot-category",
    label: "One-hot category",
    defaultValue: "small",
    options: [
      { label: "Small", value: "small", mappedTo: "size-small" },
      { label: "Large", value: "large", mappedTo: "size-large" },
    ],
  },
  {
    kind: "series",
    label: "Series",
    defaultValue: [{ value: 12 }],
    columns: [{ id: "value", kind: "number", label: "Value", unit: "kg" }],
  },
];

export const COMMON_FIELD_CASES: FieldConfig[] = [
  {
    id: "show-conditional-cases",
    kind: "boolean",
    label: "Show conditional fields",
    description:
      "Reveal one additional field of every kind. Hidden fields leave no empty grid cells.",
    defaultValue: false,
  },
  { id: "mapping-target", kind: "number", label: "Mapped value", defaultValue: 10, readOnly: true },
  ...FIELD_BASES.flatMap((base) => [
    { ...base, id: `${base.kind}-success`, label: `${base.label} · valid value`, required: true },
    {
      ...base,
      id: `${base.kind}-required-empty`,
      label: `${base.label} · required, empty`,
      defaultValue: null,
      required: true,
    },
    {
      ...base,
      id: `${base.kind}-optional-empty`,
      label: `${base.label} · optional, empty`,
      defaultValue: null,
    },
    { ...base, id: `${base.kind}-disabled`, label: `${base.label} · disabled`, disabled: true },
    { ...base, id: `${base.kind}-read-only`, label: `${base.label} · read-only`, readOnly: true },
    {
      ...base,
      id: `${base.kind}-conditional`,
      label: `${base.label} · conditionally visible`,
      hiddenWhen: { kind: "field-value" as const, field: "show-conditional-cases", equals: false },
    },
  ]).filter((field) => !["text-optional-empty", "date-optional-empty"].includes(field.id)),
];
