---
title: Disclosure Layout
description: Mount disclosure sections from the view layout contract.
---

`mountForm()` renders disclosure sections from the layout contract in `mlform/view`.

```ts
import { mountForm } from "mlform/kit";
import { predictionTransport } from "./prediction-transport";

mountForm(container, {
  transport: predictionTransport,
  schema,
  layout: {
    kind: "stacked",
    children: [
      {
        kind: "section",
        title: "Inputs",
        children: [{ kind: "field", field: "prompt" }],
      },
      {
        kind: "section",
        title: "Results",
        children: [{ kind: "report", report: "prediction" }],
      },
    ],
  },
});
```

## Behavior

- renders disclosure sections from top to bottom
- multiple sections can remain open
- every section opens by default unless `defaultOpen: false` is set
- submit stays available in a persistent footer
- opening or closing sections never validates
