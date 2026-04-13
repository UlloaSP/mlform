---
title: Modo revisión read-only
description: Bloquea edición sin ocultar valores.
---

```ts
const reviewMode = true;

mountForm(container, {
  transport: createJsonTransport({ endpoint: "/api/predict" }),
  schema: {
    fields: [
      {
        id: "prompt",
        kind: "text",
        label: "Prompt",
        readOnlyWhen: () => reviewMode,
      },
    ],
  },
  initialValues: { prompt: "Previously submitted text" },
});
```

Usa read-only para revisión y disabled cuando el valor no debería enviarse.
