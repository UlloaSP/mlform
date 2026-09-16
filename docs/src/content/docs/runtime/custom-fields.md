---
title: Custom Fields
description: Define new field kinds with declarative rendering and low boilerplate.
---

Use `defineFieldKind` for the normal extension path. It lets you define parsing, validation, serialization, and small renderer hints without writing `describe()` or a custom primitive renderer.

```ts
import { z } from "zod";
import { defineFieldKind, defineMLFormPlugin, mountForm } from "mlform/kit";

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
  validateSync: ({ value, config }) =>
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

const domainPlugin = defineMLFormPlugin({ fields: [scoreField] });
mountForm(container, { schema, transport, plugins: [domainPlugin] });
```

| Hook              | Purpose                                                            |
| ----------------- | ------------------------------------------------------------------ |
| `schema`          | Zod schema for field config.                                       |
| `value.default`   | Initial value when no default is provided.                         |
| `value.normalize` | Convert UI or host values into runtime values.                     |
| `value.serialize` | Convert runtime values into backend payload values.                |
| `validate`        | Return field-level error messages. May be async.                   |
| `definition`      | Add advanced runtime, mapping, or submission behavior.             |
| `render.widget`   | Pick a built-in renderer shape like `text`, `number`, or `select`. |
| `render.hints`    | Pass small UI hints to the built-in declarative renderer.          |

The `definition` option exposes the advanced definition hooks without leaving the normal kit
extension path: `validateConfig`, `getNestedFieldReferences`, `validateRuntime`, `onValueChanged`,
`getMappedTargets`, and `getSubmissionEntries`. The field kind, schema, value normalization, and
declarative validators remain owned by `defineFieldKind` and cannot be overridden there. A field
that implements `getSubmissionEntries` must declare every possible emitted target through
`getMappedTargets`; emitting an undeclared target fails submission.

Use `defineFieldDefinition` when you need full control over the definition itself, and pair it with
an explicit presenter or primitive component.
