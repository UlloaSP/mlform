---
title: Formulario condicional
description: Usa hiddenWhen, disabledWhen y readOnlyWhen.
---

```ts
const schema = {
  fields: [
    { id: "mode", kind: "category", label: "Mode", options: ["basic", "advanced"] },
    {
      id: "advanced_prompt",
      kind: "text",
      label: "Advanced prompt",
      hiddenWhen: { kind: "field-value", field: "mode", notEquals: "advanced" },
    },
  ],
  reports: [{ id: "prediction", kind: "classifier", label: "Prediction" }],
};
```

Usa condiciones declarativas cuando el schema viene de backend. Las funciones TypeScript no son serializables como JSON.
