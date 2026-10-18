---
title: Basic Prediction Form
description: Build a complete text, number, category, and classifier form.
---

## Goal

Collect three inputs and render one classifier report.

```ts
import { mountForm } from "mlform/kit";
import { predictionTransport } from "./prediction-transport";

mountForm(document.querySelector("#lead-score") as HTMLElement, {
  transport: predictionTransport,
  schema: {
    fields: [
      { id: "company", mappedTo: "company", kind: "text", label: "Company", required: true },
      { id: "employees", mappedTo: "employees", kind: "number", label: "Employees", min: 1 },
      {
        id: "segment",
        mappedTo: "segment",
        kind: "category",
        label: "Segment",
        options: ["startup", "mid_market", "enterprise"],
      },
    ],
    reports: [{ id: "fit", mappedTo: "fit", kind: "classifier", label: "Fit" }],
  },
  labels: { submit: "Score lead" },
});
```

Backend request:

```json
{
  "inputs": {
    "company": "Northwind",
    "employees": 300,
    "segment": "mid_market"
  }
}
```

Invalid required fields block submit, and the submit button reflects submit status. To display the
classifier report, return an envelope whose `mappedTo` matches the report configuration:

```json
{
  "reports": [
    {
      "backend": "default",
      "mappedTo": "fit",
      "status": "ready",
      "payload": { "prediction": "good fit" }
    }
  ]
}
```

Mistakes to avoid:

| Mistake                               | Fix                                                    |
| ------------------------------------- | ------------------------------------------------------ |
| Omitting backend mappings             | Set `mappedTo` for each model input and output.        |
| Returning a top-level prediction only | Return a `reports` array with explicit envelopes.      |
| Remounting on every state change      | Mount once and update through controllers when needed. |

Next: [Classification Workflow](/tutorials/classification-workflow/).
