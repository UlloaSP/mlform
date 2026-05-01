---
title: Accordion Layout
description: Use the official built-in accordion layout or the same accordion config through the headless kit API.
---

`mountAccordionForm()` is the official built-in accordion layout built on top of the headless kit API.

```ts
import { createJsonTransport, mountAccordionForm } from "mlform";

mountAccordionForm(container, {
  transport: createJsonTransport({ endpoint: "/predict" }),
  schema,
  layout: {
    kind: "accordion",
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
