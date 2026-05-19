---
title: Disclosure Layout
description: Use the official built-in disclosure layout or the same disclosure config through the headless kit API.
---

`mountForm()` is the official built-in disclosure layout built on top of the headless kit API.

```ts
import { mountForm } from "mlform/kit";
import { createJsonTransport } from "mlform/transport";

mountForm(container, {
  transport: createJsonTransport({ endpoint: "/predict" }),
  schema,
  layout: {
    kind: "stacked",
    sections: [
      {
        title: "Inputs",
        children: [{ kind: "field", field: "prompt" }],
      },
      {
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
- first section opens by default unless config overrides it
- submit stays available in a persistent footer
- opening or closing sections never validates
