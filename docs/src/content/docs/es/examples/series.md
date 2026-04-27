---
title: Series Temporales
description: Recoge pares ordenados de timestamp y valor.
---

Usa `series` cuando un modelo necesita una secuencia de observaciones numericas con fecha.

```ts
mountForm(container, {
  transport: createJsonTransport({ endpoint: "/api/forecast" }),
  schema: {
    fields: [
      {
        id: "history",
        kind: "series",
        label: "Demand history",
        field1: { kind: "date", label: "field1", required: true },
        field2: { kind: "number", label: "field2", required: true, step: 0.1 },
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
