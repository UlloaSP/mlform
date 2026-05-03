---
title: Schema
description: La forma FormSchema usada por la API actual de MLForm.
---

Un esquema de formulario tiene `fields` e informes opcionales en `reports`.

```ts
import type { FormSchema } from "mlform/runtime";

const schema: FormSchema = {
  fields: [
    {
      id: "age",
      kind: "number",
      label: "Age",
      min: 0,
      max: 120,
      required: true,
    },
  ],
  reports: [{ id: "risk", kind: "classifier", label: "Risk" }],
};
```

Cada campo tiene `kind` y `label`. `id` es opcional; si no se define, MLForm deriva un slug desde la etiqueta y resuelve duplicados.

Las opciones comunes son `description`, `required`, `disabled`, `hidden`, `readOnly`, `defaultValue`, `ui` y condiciones como `hiddenWhen`.
