---
title: Custom Fields
description: Define new field kinds with declarative rendering and low boilerplate.
---

Use `defineFieldKind` for the normal extension path. It lets you define parsing, validation, serialization, and small renderer hints without writing `describe()` or a custom primitive renderer.

```ts
import { z } from "zod";
import { mountForm } from "mlform/kit";
import { defineFieldKind, defineMLFormPlugin } from "mlform/view";
import { baseFieldConfigSchema } from "mlform/schema";

const scoreField = defineFieldKind({
  kind: "score",
  schema: baseFieldConfigSchema.extend({
    kind: z.literal("score"),
    min: z.number().default(0),
    max: z.number().default(100),
    step: z.number().optional(),
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

`baseFieldConfigSchema` is the single source of truth for shared field properties such as `id`,
`label`, conditions, `displayKey`, `mappedTo`, and `ui`. Extend it with properties owned by the new
kind instead of repeating the base contract.

For nested configuration that needs the same backend-target syntax, import `mappedToSchema` from
`mlform/schema`. It is optional for top-level configs; use `mappedToSchema.unwrap()` when the nested
property must be present.

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

`value.normalize` must be idempotent: normalizing an already normalized value must produce an
equal value. The runtime may normalize values more than once while it stabilizes conditional field
state. It fails early if a definition keeps changing its value during that process.

The `definition` option exposes the advanced definition hooks without leaving the normal kit
extension path: `validateConfig`, `getNestedFieldReferences`, `getFieldReferences`, `validateRuntime`, `onValueChanged`,
`getMappedTargets`, and `getSubmissionEntries`. The field kind, schema, value normalization, and
declarative validators remain owned by `defineFieldKind` and cannot be overridden there. A field
that implements `getSubmissionEntries` must declare every possible emitted target through
`getMappedTargets`; emitting an undeclared target fails submission.

Use `getFieldReferences` when a field's configuration names other fields. Return each referenced
id and its path within the field config; schema normalization rejects missing targets before a
runtime is created.

Use `defineFieldDefinition` when you need full control over the definition itself, and pair it with
an explicit presenter or primitive component.
