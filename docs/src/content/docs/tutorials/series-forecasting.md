---
title: Time Series Forecasting
description: Collect ordered points and render a forecast report.
---

## Goal

Collect dated numeric observations for a forecasting backend.

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
    reports: [
      { id: "forecast", kind: "regressor", label: "Next period", unit: "units", precision: 1 },
    ],
  },
});
```

Serialized request:

```json
{
  "inputs": {
    "history": [
      { "timestamp": "2026-01-01", "value": 12 },
      { "timestamp": "2026-02-01", "value": 16 },
      { "timestamp": "2026-03-01", "value": 18 }
    ]
  }
}
```

Mistakes to avoid:

| Mistake                          | Fix                            |
| -------------------------------- | ------------------------------ |
| Sending duplicate timestamps     | Keep `uniqueTimestamps: true`. |
| Mixing date and datetime formats | Choose one `granularity`.      |
