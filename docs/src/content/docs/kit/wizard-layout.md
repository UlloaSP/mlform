---
title: Wizard Layout
description: Mount the official wizard layout or consume wizard state through createFormView.
---

`mountForm()` is the official built-in wizard layout built on top of the headless kit API.

```ts
import { mountForm } from "mlform/kit";
import { createJsonTransport } from "mlform/transport";

mountForm(container, {
  transport: createJsonTransport({ endpoint: "/predict" }),
  schema: {
    fields: [
      { id: "name", kind: "text", label: "Name", required: true },
      { id: "risk", kind: "number", label: "Risk", required: true },
    ],
    reports: [{ id: "score", kind: "classifier", label: "Score" }],
  },
  layout: {
    kind: "wizard",
    steps: [
      {
        title: "Profile",
        children: [{ kind: "field", field: "name" }],
      },
      {
        title: "Assessment",
        children: [
          { kind: "field", field: "risk" },
          { kind: "report", report: "score" },
        ],
      },
    ],
  },
});
```

Rules:

- every field must appear exactly once in the wizard layout
- reports are optional
- references must point to existing ids
- step navigation validates the current step before moving forward

When you need a different presentation, keep the same wizard layout config and render it yourself through `createFormView()`.

Recommended path:

- use `mountForm()` for new built-in wizard screens
- use `createFormView()` when the host shell must be custom
