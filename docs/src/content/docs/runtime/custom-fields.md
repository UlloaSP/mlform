---
title: Custom Fields
description: Define new field kinds with declarative rendering and low boilerplate.
---

Use `defineFieldKind` for the normal extension path. It lets you define parsing, validation, serialization, and small renderer hints without writing `describe()` or a custom primitive renderer.

```ts
import { z } from "zod";
import { createMlRegistryPack } from "mlform/builtins";
import { defineFieldKind, registerDefinedFieldKind } from "mlform/kit";

const scoreField = defineFieldKind({
  kind: "score",
  schema: z.object({
    id: z.string().optional(),
    kind: z.literal("score"),
    label: z.string(),
    min: z.number().default(0),
    max: z.number().default(100),
    step: z.number().optional(),
    ui: z.record(z.string(), z.unknown()).optional(),
  }),
  value: {
    default: () => 0,
    normalize: (value) => Number(value ?? 0),
    serialize: (value) => value,
  },
  validate: ({ value, config }) =>
    value < config.min || value > config.max ? ["Score is outside the allowed range."] : [],
  render: {
    widget: "number",
    hints: ({ config }) => ({
      min: config.min,
      max: config.max,
      step: config.step ?? 1,
      unit: "%",
    }),
  },
});

const pack = createMlRegistryPack();
registerDefinedFieldKind(pack.registry, pack.descriptorRegistry, scoreField);
```

| Hook              | Purpose                                                            |
| ----------------- | ------------------------------------------------------------------ |
| `schema`          | Zod schema for field config.                                       |
| `value.default`   | Initial value when no default is provided.                         |
| `value.normalize` | Convert UI or host values into runtime values.                     |
| `value.serialize` | Convert runtime values into backend payload values.                |
| `validate`        | Return field-level error messages. May be async.                   |
| `render.widget`   | Pick a built-in renderer shape like `text`, `number`, or `select`. |
| `render.hints`    | Pass small UI hints to the built-in declarative renderer.          |

Use `defineFieldDefinition` only when you need full control over schema behavior and pair it with an explicit presenter or primitive component.
