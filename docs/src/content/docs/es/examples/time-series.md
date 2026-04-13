---
title: Series Temporales
description: Recoge pares ordenados de timestamp y valor.
---

Usa `time-series` cuando un modelo necesita una secuencia de observaciones numericas con fecha.

```ts
mountForm(container, {
  transport: createJsonTransport({ endpoint: "/api/forecast" }),
  schema: {
    fields: [
      {
        id: "history",
        kind: "time-series",
        label: "Demand history",
        minPoints: 3,
        maxPoints: 24,
        granularity: "date",
        ordered: "asc",
        uniqueTimestamps: true,
        minValue: 0,
        unit: "units",
      },
    ],
    reports: [{ id: "forecast", kind: "regressor", label: "Next period", precision: 1 }],
  },
});
```

Los valores serializados contienen un array de objetos `{ timestamp, value }`.
