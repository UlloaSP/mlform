---
title: Valores iniciales
description: defaultValue e initialValues.
---

`defaultValue` pertenece al schema. `initialValues` pertenece al host app.

```ts
mountForm(container, {
  endpoint: "/api/predict",
  schema,
  initialValues: {
    threshold: 0.85,
    prompt: "Existing draft text",
  },
});
```

`initialValues` tiene prioridad sobre `defaultValue`. Usa `defaultValue` para defaults de negocio y `initialValues` para borradores, filtros o datos de usuario.
