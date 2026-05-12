---
title: Review Before Submit
description: Add a final review-oriented step before the user submits a wizard.
---

Pattern:

1. early steps collect inputs
2. final step shows reports or explanations
3. host renders a summary of current field values

Typical final step nodes:

```ts
{
  title: "Review",
  children: [
    { kind: "report", report: "risk" },
    { kind: "explanation", explanation: "why" },
  ],
}
```

This works well when the user needs confidence before final submit or when outputs are decision support.
