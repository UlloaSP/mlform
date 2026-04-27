---
title: Campos inactivos
description: Envío de campos hidden, disabled y readOnly.
---

| Estado     | Visible        | Editable | Comportamiento por defecto                           |
| ---------- | -------------- | -------- | ---------------------------------------------------- |
| `hidden`   | No             | No       | Se omite si está inactivo.                           |
| `disabled` | Normalmente sí | No       | Se omite si está inactivo.                           |
| `readOnly` | Sí             | No       | Se incluye salvo que también esté hidden o disabled. |

El default del kit es `inactiveFieldPolicy: "omit"`.

```ts
mountForm(container, {
  transport: createJsonTransport({ endpoint: "/api/predict" }),
  schema,
  inactiveFieldPolicy: "include",
});
```

Usa `"include"` solo cuando el backend necesita el snapshot completo.
