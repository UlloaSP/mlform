---
title: mountForm
description: Monta MLForm en un elemento host con los defaults del kit.
---

`mountForm(container, options)` crea el form engine, monta los Web Components primitives, adjunta el sistema de diseño y devuelve un handle montado.

```ts
import { mountForm } from "mlform";

const mounted = mountForm(container, {
  endpoint: "/api/predict",
  schema,
  initialValues: { age: 42 },
  labels: { submit: "Predict" },
  layout: "split",
  reportPane: "auto",
});
```

El objeto devuelto expone:

| Propiedad o metodo              | Uso                                                             |
| ------------------------------- | --------------------------------------------------------------- |
| `form`                          | Acceso al `FormController`.                                     |
| `host`                          | Acceso al Web Component host.                                   |
| `updateDesignSystem(config)`    | Mezcla cambios del sistema de diseño.                           |
| `replaceDesignSystem(snapshot)` | Sustituye con `mode`, `theme` y `recipe` explicitos.            |
| `resetDesignSystem()`           | Restaura defaults.                                              |
| `unmount()`                     | Aborta envios pendientes, desconecta estilos y elimina el host. |
