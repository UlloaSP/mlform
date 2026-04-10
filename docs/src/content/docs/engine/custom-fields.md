---
title: Custom Fields
description: Define new field kinds for advanced schemas.
---

A custom field definition validates config, normalizes values, serializes values, and describes what a renderer should mount.

```ts
import { z } from "zod";
import { createBuiltinRegistry } from "mlform/engine";

const scoreField = {
  kind: "score",
  schema: z.object({
    id: z.string().optional(),
    kind: z.literal("score"),
    label: z.string(),
    min: z.number().default(0),
    max: z.number().default(100),
  }),
  getDefaultValue: () => 0,
  normalizeValue: (value) => Number(value ?? 0),
  serializeValue: (value) => value,
  validate: (value, config) =>
    value < config.min || value > config.max ? ["Score is outside the allowed range."] : [],
  describe: (config, context) => ({
    component: "score-field",
    props: { ...config, value: context.state.value },
  }),
};

const registry = createBuiltinRegistry().registerField(scoreField);
```

| Hook              | Purpose                                             |
| ----------------- | --------------------------------------------------- |
| `schema`          | Zod schema for field config.                        |
| `getDefaultValue` | Initial value when no default is provided.          |
| `normalizeValue`  | Convert UI/host values into runtime values.         |
| `serializeValue`  | Convert runtime values into backend payload values. |
| `validate`        | Return field-level error messages. May be async.    |
| `describe`        | Return renderer descriptor.                         |

Thenable support is kept for compatibility, but new code should return real promises for async validation.
