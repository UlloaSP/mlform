---
title: Campos personalizados
description: Define nuevos tipos de campo con renderizado declarativo y poco boilerplate.
---

Usa `defineFieldKind` para el camino normal. Registra el resultado en el schema registry y en el presentation registry del pack.

```ts
import { z } from "zod";
import { createMlRegistryPack } from "mlform/builtins-ml";
import { defineFieldKind, registerDefinedFieldKind } from "mlform/presentation";

const scoreField = defineFieldKind({
  kind: "score",
  schema: z.object({
    id: z.string().optional(),
    kind: z.literal("score"),
    label: z.string(),
    min: z.number().default(0),
    max: z.number().default(100),
  }),
  value: {
    default: () => 0,
    normalize: (value) => Number(value ?? 0),
    serialize: (value) => value,
  },
  validate: ({ value, config }) =>
    value < config.min || value > config.max ? ["Score fuera de rango."] : [],
  render: {
    widget: "number",
    hints: ({ config }) => ({ min: config.min, max: config.max, unit: "%" }),
  },
});

const pack = createMlRegistryPack();
registerDefinedFieldKind(pack.registry, pack.presentationRegistry, scoreField);
```

Usa `defineFieldDefinition` solo cuando necesites separar por completo schema, presenter o renderer primitivo.
