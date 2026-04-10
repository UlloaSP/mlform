---
title: Forecasting con series temporales
description: Campo time-series y salida regressor.
---

```ts
const schema = {
  fields: [
    {
      id: "history",
      kind: "time-series",
      label: "Monthly revenue",
      minPoints: 3,
      granularity: "month",
      ordered: true,
      uniqueTimestamps: true,
      unit: "USD",
    },
  ],
  reports: [{ id: "forecast", kind: "regressor", label: "Next month" }],
};
```

Ordena los puntos por timestamp y evita duplicados cuando el modelo depende de la secuencia.
