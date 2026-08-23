---
title: ML Classification
description: Classification flow with fields, a classifier report, and a JSON backend.
---

```ts
import { mountForm } from "mlform/kit";
import { createJsonTransport } from "mlform/transport";

mountForm(document.querySelector("#credit-risk") as HTMLElement, {
  transport: createJsonTransport({ endpoint: "/api/credit-risk" }),
  schema: {
    fields: [
      { id: "income", kind: "number", label: "Annual income", mappedTo: "income", min: 0, unit: "USD" },
      { id: "debt", kind: "number", label: "Total debt", mappedTo: "debt", min: 0, unit: "USD" },
      {
        id: "employment",
        kind: "category",
        label: "Employment",
        mappedTo: "employment",
        options: [
          { label: "Full time", value: "full_time" },
          { label: "Contract", value: "contract" },
          { label: "Unemployed", value: "unemployed" },
        ],
      },
    ],
    reports: [
      {
        id: "risk",
        kind: "classifier",
        label: "Credit risk",
        mappedTo: "risk",
        labels: ["low", "medium", "high"],
      },
    ],
  },
  layout: "split",
});
```

Example response:

```json
{
  "reports": [
    {
      "backend": "default",
      "mappedTo": "risk",
      "status": "ready",
      "payload": {
        "prediction": "medium",
        "probabilities": [0.11, 0.82, 0.07]
      }
    }
  ]
}
```
