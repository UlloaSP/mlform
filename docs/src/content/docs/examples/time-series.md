---
title: Time Series
description: Collect ordered timestamp and value pairs.
---

Use `time-series` when a model needs a sequence of dated numeric observations.

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

Serialized values contain an array of `{ timestamp, value }` objects.
