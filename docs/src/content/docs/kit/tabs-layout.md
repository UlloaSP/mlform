---
title: Tabs Layout
description: Mount tabs from the view layout contract.
---

`mountForm()` renders tabs from the layout contract in `mlform/view`.

```ts
import { mountForm } from "mlform/kit";
import { predictionTransport } from "./prediction-transport";

mountForm(container, {
  transport: predictionTransport,
  schema,
  layout: {
    kind: "tabs",
    tabs: [
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

- renders a top tablist
- shows only the active tab panel
- keeps submit available from the built-in footer
- does not validate when switching tabs
- still uses the engine for visibility, validation, and submit

## When to use it

Use `mountForm()` when:

- your app already uses tabbed navigation
- users should move freely between sections
- you want built-in DOM instead of a custom shell

Use `createFormView()` with `layout.kind === "tabs"` when:

- the host app owns the chrome
- you need custom badges, counters, or side panels
- the visual treatment must match an existing component system
