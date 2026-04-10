---
title: Classification Workflow
description: Render classifier labels, confidence, and probability details.
---

## Goal

Show a classifier report with class labels and probabilities.

```ts
mountForm(container, {
  endpoint: "/api/classify",
  schema: {
    fields: [{ id: "text", kind: "text", label: "Text", required: true }],
    reports: [
      {
        id: "intent",
        kind: "classifier",
        label: "Intent",
        labels: ["support", "sales", "other"],
        details: true,
      },
    ],
  },
});
```

Response:

```json
{
  "reports": {
    "intent": {
      "label": "support",
      "confidence": 0.88,
      "probabilities": {
        "support": 0.88,
        "sales": 0.07,
        "other": 0.05
      }
    }
  }
}
```

Expected UI behavior: the report renders only after submit and can show details when the payload includes them.

Mistakes to avoid:

| Mistake                                 | Fix                                                |
| --------------------------------------- | -------------------------------------------------- |
| Using display labels as backend keys    | Use stable report ids.                             |
| Hiding classifier details in the schema | Set `details: true` or omit it to use the default. |

Next: [Regression Workflow](./regression-workflow/).
