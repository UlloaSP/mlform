---
title: Time Series Forecasting
description: Collect ordered points and render a forecast report.
---

## Goal

Collect dated numeric observations for a forecasting backend.

```ts
import { predictionTransport } from "./prediction-transport";

mountForm(container, {
  transport: predictionTransport,
  schema: {
    fields: [
      {
        id: "history",
        kind: "series",
        label: "Demand history",
        mappedTo: "history",
        columns: [
          { id: "date", kind: "date", label: "Date", required: true },
          { id: "demand", kind: "number", label: "Demand", required: true, min: 0, unit: "units" },
        ],
        minPoints: 3,
        maxPoints: 24,
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
  "modelValues": {
    "history": [
      { "date": "2026-01-01T00:00:00.000Z", "demand": 12 },
      { "date": "2026-02-01T00:00:00.000Z", "demand": 16 },
      { "date": "2026-03-01T00:00:00.000Z", "demand": 18 }
    ]
  }
}
```

Mistakes to avoid:

| Mistake                              | Fix                                                        |
| ------------------------------------ | ---------------------------------------------------------- |
| Omitting the backend target          | Set `mappedTo` explicitly.                                 |
| Using an unsupported sub-field kind  | Use `text`, `number`, `date`, `category`, or `boolean`.    |
| Expecting timestamp-specific sorting | Sort and de-duplicate values before assigning the series.  |
