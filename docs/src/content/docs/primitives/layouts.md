---
title: Layouts
description: Primitive layout options for form and report placement.
---

| Option       | Values                     | Purpose                           |
| ------------ | -------------------------- | --------------------------------- |
| `layout`     | `stacked`, `split`         | Controls form/report arrangement. |
| `reportPane` | `auto`, `always`, `hidden` | Controls report pane visibility.  |

```ts
import { predictionTransport } from "./prediction-transport";

mountForm(container, {
  transport: predictionTransport,
  schema,
  layout: { kind: "split" },
  reportPane: "auto",
});
```

Use `stacked` for narrow embeds and simple forms. Use `split` when reports are central to the workflow.
