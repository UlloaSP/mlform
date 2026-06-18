---
title: mountForm
description: Monta MLForm en un elemento host con los defaults del kit.
---

`mountForm(container, options)` crea el form engine, monta los Web Components primitives, adjunta el sistema de diseño y devuelve un handle montado.

```ts
import { mountForm } from "mlform/kit";
import { createJsonTransport } from "mlform/transport";

const mounted = mountForm(container, {
  transport: createJsonTransport({ endpoint: "/api/predict" }),
  schema,
  initialValues: { age: 42 },
  labels: { submit: "Predict" },
  layout: "split",
  reportPane: "auto",
  reportFetchMode: "all",
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

Notas:

- `mountForm` espera un contenedor vacio por defecto.
- Usa `containerStrategy: "replace"` solo cuando quieras sustituir contenido existente del host y restaurarlo en `unmount()`.
- `reportFetchMode` controla informes async tras submit: `"lazy"` mantiene fetch desde renderers, `"all"` espera todos los informes antes del evento success, y `"none"` no hace fetch de informes.
