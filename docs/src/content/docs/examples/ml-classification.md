---
title: ML Classification
description: Classification flow with fields, a classifier report, and a JSON backend.
---

```ts
import { mountForm } from "mlform";

mountForm(document.querySelector("#credit-risk") as HTMLElement, {
  endpoint: "/api/credit-risk",
  schema: {
    fields: [
      { id: "income", kind: "number", label: "Annual income", min: 0, unit: "USD" },
      { id: "debt", kind: "number", label: "Total debt", min: 0, unit: "USD" },
      {
        id: "employment",
        kind: "category",
        label: "Employment",
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
  "reports": {
    "risk": {
      "label": "medium",
      "confidence": 0.82,
      "probabilities": {
        "low": 0.11,
        "medium": 0.82,
        "high": 0.07
      }
    }
  }
}
```
