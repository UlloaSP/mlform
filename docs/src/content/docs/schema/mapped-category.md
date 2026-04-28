---
title: Mapped Category
description: A category field that automatically fills subordinate fields based on a mapping table.
---

The `mapped-category` field solves a common ML problem: models often expect one-hot encoded or structured inputs (e.g., `is_red`, `is_green`, `is_blue`), but exposing those raw fields to users creates bad UX and allows impossible combinations. Instead of showing N separate inputs, `mapped-category` presents a single dropdown and silently writes the correct values to hidden subordinate fields.

## How It Works

1. User selects an option from the dropdown (renders identically to a regular `category` field).
2. The engine reads the selected option's `mapping` object.
3. For each entry in `mapping`, the engine writes the value to the corresponding subordinate field via `commitState`.
4. All updates happen inside a single `store.batch` — subscribers see one atomic state change.

```
User selects "Red"
  → mapping: { is_red: 1, is_green: 0, is_blue: 0 }
    → is_red = 1, is_green = 0, is_blue = 0
    → all written atomically
```

## Schema

```ts
{
  kind: "mapped-category",
  label: "Color",
  options: [
    { label: "Red",   value: "red",   mapping: { is_red: 1, is_green: 0, is_blue: 0 } },
    { label: "Green", value: "green", mapping: { is_red: 0, is_green: 1, is_blue: 0 } },
    { label: "Blue",  value: "blue",  mapping: { is_red: 0, is_green: 0, is_blue: 1 } },
  ],
}
```

### Option Shape

Every option **must** be an object with `label`, `value`, and `mapping`:

| Property  | Type                      | Description                                     |
| --------- | ------------------------- | ----------------------------------------------- |
| `label`   | `string`                  | Display text shown in the dropdown.             |
| `value`   | `string`                  | Internal value stored when selected.            |
| `mapping` | `Record<string, unknown>` | Map of `fieldId → value` to apply on selection. |

Unlike regular `category`, plain string options are **not** allowed — the `mapping` property is required.

### Shared Options

`mapped-category` supports all [shared field options](/schema/fields/) (`id`, `label`, `description`, `required`, `defaultValue`, `hiddenWhen`, `disabledWhen`, `readonlyWhen`, `ui`).

## Subordinate Fields

Fields referenced in `mapping` are called **subordinate fields**. They typically should be:

- **Hidden** (`hidden: true` or via `hiddenWhen`) — users don't need to see or interact with them.
- **`inactiveFieldPolicy: "include"`** — so their values are included in the submission payload even when hidden. Without this, hidden fields are omitted by default.

```ts
{ kind: "number", id: "is_red",   label: "is_red",   hidden: true, inactiveFieldPolicy: "include" }
{ kind: "number", id: "is_green", label: "is_green", hidden: true, inactiveFieldPolicy: "include" }
{ kind: "number", id: "is_blue",  label: "is_blue",  hidden: true, inactiveFieldPolicy: "include" }
```

## Validation

The engine performs two levels of validation to catch configuration errors early:

### At Form Creation

When `createForm()` is called, for every `mapped-category` field the engine checks that every `mapping` key references an existing field ID in the schema. If a target ID doesn't exist, it throws:

```
EngineError: mapped-category "color": mapping references unknown field "is_purple".
```

### At Runtime

When a mapped value is applied, the engine coerces it through the target field's `coerceValue` and then runs the target field definition's `validate` function. If the value is incompatible, it throws:

```
EngineError: mapped-category "color": value "hello" invalid for "is_red": Expected a number.
```

This ensures you can't accidentally map a string to a number field, an invalid option to a category field, etc.

## Examples

### Example 1: One-Hot Encoding (Classification)

A model trained on color categories expects three binary features:

```ts
const schema = {
  fields: [
    {
      kind: "mapped-category",
      id: "color",
      label: "Color",
      required: true,
      options: [
        { label: "Red", value: "red", mapping: { is_red: 1, is_green: 0, is_blue: 0 } },
        { label: "Green", value: "green", mapping: { is_red: 0, is_green: 1, is_blue: 0 } },
        { label: "Blue", value: "blue", mapping: { is_red: 0, is_green: 0, is_blue: 1 } },
      ],
    },
    { kind: "number", id: "is_red", label: "is_red", hidden: true, inactiveFieldPolicy: "include" },
    {
      kind: "number",
      id: "is_green",
      label: "is_green",
      hidden: true,
      inactiveFieldPolicy: "include",
    },
    {
      kind: "number",
      id: "is_blue",
      label: "is_blue",
      hidden: true,
      inactiveFieldPolicy: "include",
    },
    { kind: "number", id: "size", label: "Size (cm)", min: 1, max: 100, required: true },
  ],
  reports: [{ kind: "classifier" }],
};
```

When user selects "Green", the submission payload includes:

```json
{ "is_red": 0, "is_green": 1, "is_blue": 0, "size": 42 }
```

### Example 2: Subscription Tier (Multi-Field Mapping)

A pricing model needs multiple parameters per tier. Instead of separate dropdowns for each feature:

```ts
const schema = {
  fields: [
    {
      kind: "mapped-category",
      id: "plan",
      label: "Subscription Plan",
      required: true,
      options: [
        {
          label: "Free",
          value: "free",
          mapping: { max_users: 1, storage_gb: 5, has_api: 0, has_support: 0 },
        },
        {
          label: "Pro",
          value: "pro",
          mapping: { max_users: 10, storage_gb: 50, has_api: 1, has_support: 0 },
        },
        {
          label: "Enterprise",
          value: "enterprise",
          mapping: { max_users: 100, storage_gb: 500, has_api: 1, has_support: 1 },
        },
      ],
    },
    {
      kind: "number",
      id: "max_users",
      label: "Max Users",
      hidden: true,
      inactiveFieldPolicy: "include",
    },
    {
      kind: "number",
      id: "storage_gb",
      label: "Storage (GB)",
      hidden: true,
      inactiveFieldPolicy: "include",
    },
    {
      kind: "number",
      id: "has_api",
      label: "API Access",
      hidden: true,
      inactiveFieldPolicy: "include",
    },
    {
      kind: "number",
      id: "has_support",
      label: "Priority Support",
      hidden: true,
      inactiveFieldPolicy: "include",
    },
    { kind: "number", id: "annual_revenue", label: "Annual Revenue ($)", required: true },
  ],
  reports: [{ kind: "regressor" }],
};
```

### Example 3: Multiple Independent Masters

Two mapped-category fields can coexist, each controlling separate subordinate fields:

```ts
const schema = {
  fields: [
    {
      kind: "mapped-category",
      id: "region",
      label: "Region",
      options: [
        {
          label: "North America",
          value: "na",
          mapping: { continent_na: 1, continent_eu: 0, continent_asia: 0 },
        },
        {
          label: "Europe",
          value: "eu",
          mapping: { continent_na: 0, continent_eu: 1, continent_asia: 0 },
        },
        {
          label: "Asia",
          value: "asia",
          mapping: { continent_na: 0, continent_eu: 0, continent_asia: 1 },
        },
      ],
    },
    {
      kind: "mapped-category",
      id: "season",
      label: "Season",
      options: [
        { label: "Spring", value: "spring", mapping: { q1: 0, q2: 1, q3: 0, q4: 0 } },
        { label: "Summer", value: "summer", mapping: { q1: 0, q2: 0, q3: 1, q4: 0 } },
        { label: "Autumn", value: "autumn", mapping: { q1: 0, q2: 0, q3: 0, q4: 1 } },
        { label: "Winter", value: "winter", mapping: { q1: 1, q2: 0, q3: 0, q4: 0 } },
      ],
    },
    // Region subordinates
    {
      kind: "number",
      id: "continent_na",
      label: "continent_na",
      hidden: true,
      inactiveFieldPolicy: "include",
    },
    {
      kind: "number",
      id: "continent_eu",
      label: "continent_eu",
      hidden: true,
      inactiveFieldPolicy: "include",
    },
    {
      kind: "number",
      id: "continent_asia",
      label: "continent_asia",
      hidden: true,
      inactiveFieldPolicy: "include",
    },
    // Season subordinates
    { kind: "number", id: "q1", label: "Q1", hidden: true, inactiveFieldPolicy: "include" },
    { kind: "number", id: "q2", label: "Q2", hidden: true, inactiveFieldPolicy: "include" },
    { kind: "number", id: "q3", label: "Q3", hidden: true, inactiveFieldPolicy: "include" },
    { kind: "number", id: "q4", label: "Q4", hidden: true, inactiveFieldPolicy: "include" },
    // Regular input
    { kind: "number", id: "sales", label: "Sales Volume", required: true },
  ],
  reports: [{ kind: "regressor" }],
};
```

### Example 4: Mapping to Category Fields

Subordinate fields don't have to be numbers. You can map to any field type, as long as the value is valid for that field:

```ts
const schema = {
  fields: [
    {
      kind: "mapped-category",
      id: "preset",
      label: "Model Preset",
      options: [
        {
          label: "Conservative",
          value: "conservative",
          mapping: { risk_tolerance: "low", leverage: 1, stop_loss: 5 },
        },
        {
          label: "Balanced",
          value: "balanced",
          mapping: { risk_tolerance: "medium", leverage: 3, stop_loss: 10 },
        },
        {
          label: "Aggressive",
          value: "aggressive",
          mapping: { risk_tolerance: "high", leverage: 10, stop_loss: 25 },
        },
      ],
    },
    {
      kind: "category",
      id: "risk_tolerance",
      label: "Risk Tolerance",
      hidden: true,
      inactiveFieldPolicy: "include",
      options: ["low", "medium", "high"],
    },
    {
      kind: "number",
      id: "leverage",
      label: "Leverage",
      hidden: true,
      inactiveFieldPolicy: "include",
    },
    {
      kind: "number",
      id: "stop_loss",
      label: "Stop Loss (%)",
      hidden: true,
      inactiveFieldPolicy: "include",
    },
    { kind: "number", id: "portfolio_value", label: "Portfolio Value ($)", required: true },
  ],
  reports: [{ kind: "regressor" }],
};
```

### Example 5: With Conditional Visibility

Combine `mapped-category` with `hiddenWhen` to show subordinate fields only when a condition is met — useful for debugging or advanced mode:

```ts
const schema = {
  fields: [
    { kind: "boolean", id: "show_details", label: "Show Feature Details" },
    {
      kind: "mapped-category",
      id: "material",
      label: "Material",
      required: true,
      options: [
        { label: "Steel", value: "steel", mapping: { density: 7.8, conductivity: 50 } },
        { label: "Aluminum", value: "aluminum", mapping: { density: 2.7, conductivity: 205 } },
        { label: "Copper", value: "copper", mapping: { density: 8.9, conductivity: 385 } },
      ],
    },
    {
      kind: "number",
      id: "density",
      label: "Density (g/cm³)",
      inactiveFieldPolicy: "include",
      hiddenWhen: { kind: "field-value", field: "show_details", notEquals: true },
      readonlyWhen: { kind: "field-value", field: "show_details", equals: true },
    },
    {
      kind: "number",
      id: "conductivity",
      label: "Thermal Conductivity (W/m·K)",
      inactiveFieldPolicy: "include",
      hiddenWhen: { kind: "field-value", field: "show_details", notEquals: true },
      readonlyWhen: { kind: "field-value", field: "show_details", equals: true },
    },
    { kind: "number", id: "thickness", label: "Thickness (mm)", required: true },
  ],
  reports: [{ kind: "regressor" }],
};
```

Here, `density` and `conductivity` are hidden by default but become visible (and read-only) when the user toggles "Show Feature Details". The mapping still applies regardless of visibility.

## Programmatic Usage

### Setting Values via `setValues`

Mapped-category effects also trigger when you set values programmatically:

```ts
form.setValues({ color: "green" });
// → is_red = 0, is_green = 1, is_blue = 0
```

### Reading Subordinate Values

```ts
const values = form.getValues();
console.log(values.is_red); // 0
console.log(values.is_green); // 1
console.log(values.is_blue); // 0
```

## Key Points

- **UI**: Renders as a standard `<mlf-category-field>` — no new web component needed.
- **Mapping direction**: Unidirectional. Master → subordinates only. Changing a subordinate field directly does **not** update the master.
- **Atomicity**: All mapping writes happen in a single batch. Subscribers receive one notification.
- **`inactiveFieldPolicy`**: Subordinate fields should use `"include"` to appear in submission payloads when hidden.
- **Validation**: Target field IDs are validated at form creation. Mapped values are validated against target field definitions at runtime.
- **No cycles**: The engine does not detect cycles between mapped-category fields. Avoid mapping one mapped-category to another.
