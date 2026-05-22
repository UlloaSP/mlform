---
title: Mapped Category
description: A category field that writes mapped values into subordinate fields.
---

`mapped-category` is for model inputs that are awkward for users to edit directly. A model may expect one-hot values like `is_red`, `is_green`, and `is_blue`; the user should pick "Red" once.

The master field renders like a category dropdown. When the value changes, MLForm writes each mapped value into its target field.

```txt
User selects "Red"
  -> mapping: { is_red: 1, is_green: 0, is_blue: 0 }
  -> subordinate fields update in one batch
```

By default, the master `mapped-category` value is not submitted. The backend receives the subordinate fields. Set `includeInSubmission: true` on the master only when the backend also needs the selected label/value.

## Schema

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
    { kind: "number", id: "is_green", label: "is_green", hidden: true, inactiveFieldPolicy: "include" },
    { kind: "number", id: "is_blue", label: "is_blue", hidden: true, inactiveFieldPolicy: "include" },
    { kind: "number", id: "size", label: "Size (cm)", min: 1, max: 100, required: true },
  ],
  reports: [{ kind: "classifier" }],
};
```

When the user selects "Green", submission includes:

```json
{ "is_red": 0, "is_green": 1, "is_blue": 0, "size": 42 }
```

## Options

Every option must be an object with `label`, `value`, and `mapping`.

| Property | Type | Meaning |
| --- | --- | --- |
| `label` | `string` | Text shown in the dropdown. |
| `value` | `string` | Stored value for the master field. |
| `mapping` | `Record<string, unknown>` | Target field ids and values to write. |

Plain string options are not valid for `mapped-category`.

## Subordinate Fields

Fields referenced in `mapping` are subordinate fields. They usually should be hidden and submitted:

```ts
{
  kind: "number",
  id: "is_red",
  label: "is_red",
  hidden: true,
  inactiveFieldPolicy: "include",
}
```

Without `inactiveFieldPolicy: "include"`, hidden subordinate values are omitted from the payload.

Subordinate fields can use any compatible field type. For example, a preset can map to a hidden `category` field if the mapped value is one of that field's allowed options.

## Validation

MLForm checks mappings in two places:

| Time | Check |
| --- | --- |
| form creation | Every mapping target id exists in the schema. |
| value apply | Each mapped value passes the target field's coercion and validation. |

Example setup failure:

```txt
EngineError: mapped-category "color": mapping references unknown field "is_purple".
```

Example runtime failure:

```txt
EngineError: mapped-category "color": value "hello" invalid for "is_red": Expected a number.
```

## Programmatic Values

Mapping also runs when host code sets the master value:

```ts
form.setValues({ color: "green" });
```

After that call, `is_red`, `is_green`, and `is_blue` contain the mapped values.

## Rules

- Mapping is one-way: master to subordinate fields.
- Changing a subordinate field does not update the master.
- Writes happen in one batch, so subscribers see one state change.
- `mapped-category` is excluded from submission by default.
- Target field ids are validated at form creation.
- Target values are validated at runtime.
- Avoid mapping one `mapped-category` into another.
