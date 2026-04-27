---
title: Forecasting con series temporales
description: Campo series y salida regressor.
---

```ts
const schema = {
  fields: [
    {
      id: "history",
      kind: "series",
      label: "Monthly revenue",
      field1: { kind: "date", label: "field1", required: true },
      field2: { kind: "number", label: "field2", required: true, step: 0.1 },
      minPoints: 3,
      granularity: "date",
      ordered: "asc",
      uniqueTimestamps: true,
      unit: "USD",
    },
  ],
  reports: [{ id: "forecast", kind: "regressor", label: "Next month" }],
};
```

Ordena los puntos por timestamp y evita duplicados cuando el modelo depende de la secuencia.
