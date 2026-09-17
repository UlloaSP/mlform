---
title: Paired Series
description: Collect repeated pairs of related values.
---

Use `series` when a model needs a sequence of paired observations. Each side uses a supported
built-in field definition: `text`, `number`, `date`, `category`, or `boolean`.

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
        field1: { kind: "date", label: "Date", required: true },
        field2: { kind: "number", label: "Demand", required: true, min: 0, unit: "units" },
        minPoints: 3,
        maxPoints: 24,
      },
    ],
    reports: [{ id: "forecast", kind: "regressor", label: "Next period", precision: 1 }],
  },
});
```

Serialized values contain an array of `{ field1, field2 }` objects. The date definition serializes
`field1` to `YYYY-MM-DD`; the number definition serializes `field2` as a number.
