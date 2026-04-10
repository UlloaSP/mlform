---
title: Live preview
description: Suscríbete al estado para pintar una vista previa del host.
---

```ts
const mounted = mountForm(container, { endpoint: "/api/predict", schema });

const unsubscribe = mounted.form.subscribeSelector(
  (state) => state.values,
  (values) => {
    preview.textContent = JSON.stringify(values, null, 2);
  },
  { emitInitial: true },
);
```

Debouncea trabajo costoso si la vista previa se actualiza en cada cambio.
