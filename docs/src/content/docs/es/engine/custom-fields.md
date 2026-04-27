---
title: Campos personalizados
description: Define nuevos kinds de campo.
---

Un `FieldDefinition` valida configuración, normaliza valores, serializa valores y describe un renderer.

```ts
const scoreField = {
  kind: "score",
  schema,
  getDefaultValue: () => 0,
  normalizeValue: (value) => Number(value ?? 0),
  serializeValue: (value) => value,
  validate: (value) => (value < 0 ? ["Score must be positive."] : []),
  describe: (config, context) => ({
    component: "score-field",
    props: { ...config, value: context.state.value },
  }),
};
```

`validate` puede ser async. Para código nuevo, devuelve promesas reales en vez de thenables manuales.
