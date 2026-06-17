---
title: OneHot Category
description: A compact category field for strict one-hot encoded model inputs.
---

`onehot-category` renders like a category field and submits one 0/1 column per option. The selected option gets `1`; every other option gets `0`.

## Schema

```ts
const schema = {
  fields: [
    {
      kind: "onehot-category",
      id: "color",
      label: "Color",
      required: true,
      options: [
        { label: "Red", value: "red", mappedTo: "is_red" },
        { label: "Green", value: "green", mappedTo: "is_green" },
        { label: "Blue", value: "blue", mappedTo: "is_blue" },
      ],
    },
    { kind: "number", id: "size", label: "Size", mappedTo: "size" },
  ],
  reports: [{ kind: "classifier", mappedTo: "risk" }],
};
```

Selecting `green` submits:

```json
{ "is_red": 0, "is_green": 1, "is_blue": 0, "size": 42 }
```

No hidden subordinate fields are needed.

## Options

| Property | Type | Meaning |
| --- | --- | --- |
| `label` | `string` | Text shown in the dropdown. |
| `value` | `string` | Stored UI value. |
| `mappedTo` | `string \| number \| record` | Backend feature key, numeric position, or backend-specific map. |

Rules:

- `onehot-category` is strict 0/1 encoding.
- Duplicate resolved `mappedTo` targets throw.
- Missing backend-specific `mappedTo` targets throw.
- Use `mapped-category` for arbitrary mappings or multi-column presets.
