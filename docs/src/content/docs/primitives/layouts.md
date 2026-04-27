---
title: Layouts
description: Primitive layout options for form and report placement.
---

| Option       | Values                     | Purpose                           |
| ------------ | -------------------------- | --------------------------------- |
| `layout`     | `stacked`, `split`         | Controls form/report arrangement. |
| `reportPane` | `auto`, `always`, `hidden` | Controls report pane visibility.  |

```ts
mountForm(container, {
  transport: createJsonTransport({ endpoint: "/api/predict" }),
  schema,
  layout: "split",
  reportPane: "auto",
});
```

Use `stacked` for narrow embeds and simple forms. Use `split` when reports are central to the workflow.
