---
title: Overview de schema
description: Estructura de FormSchema, campos, informes y condiciones.
---

Un `FormSchema` describe lo que el formulario pide y lo que el backend devuelve.

```ts
const schema = {
  fields: [
    { id: "prompt", kind: "text", label: "Prompt", required: true },
    { id: "threshold", kind: "number", label: "Threshold", min: 0, max: 1 },
  ],
  reports: [{ id: "prediction", kind: "classifier", label: "Prediction" }],
};
```

| Tipo             | Propósito                                                 |
| ---------------- | --------------------------------------------------------- |
| `FormSchema`     | Objeto raíz con `fields` y `reports`.                     |
| `FieldConfig`    | Un campo de entrada.                                      |
| `ReportConfig`   | Un informe de salida.                                     |
| `FieldCondition` | Regla para `hiddenWhen`, `disabledWhen` o `readOnlyWhen`. |

Usa ids explícitos en producción. Los ids generados sirven para demos, pero los ids estables simplifican backend, tests y analítica.
