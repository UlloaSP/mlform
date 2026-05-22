---
title: Basic Prediction Form
description: Build a complete text, number, category, and classifier form.
---

## Goal

Collect three inputs and render one classifier report.

```ts
import { mountForm } from "mlform/kit";
import { createJsonTransport } from "mlform/transport";

mountForm(document.querySelector("#lead-score") as HTMLElement, {
  transport: createJsonTransport({ endpoint: "/api/lead-score" }),
  schema: {
    fields: [
      { id: "company", kind: "text", label: "Company", required: true },
      { id: "employees", kind: "number", label: "Employees", min: 1 },
      {
        id: "segment",
        kind: "category",
        label: "Segment",
        options: ["startup", "mid_market", "enterprise"],
      },
    ],
    reports: [{ id: "fit", kind: "classifier", label: "Fit" }],
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

Expected UI behavior: invalid required fields block submit, the submit button reflects submit status, and the classifier report appears after the backend returns `reports.fit`.

Mistakes to avoid:

| Mistake                               | Fix                                                    |
| ------------------------------------- | ------------------------------------------------------ |
| Omitting stable ids                   | Add ids when the backend depends on key names.         |
| Returning a top-level prediction only | Return `reports.fit`.                                  |
| Remounting on every state change      | Mount once and update through controllers when needed. |

Next: [Classification Workflow](./classification-workflow/).
