---
title: Tabs Layout
description: Use the official built-in tabs layout or the same tabs config through the headless kit API.
---

`mountTabsForm()` is the official built-in tabs layout built on top of the headless kit API.

```ts
import { mountTabsForm } from "mlform/kit";
import { createJsonTransport } from "mlform/transport";

mountTabsForm(container, {
  transport: createJsonTransport({ endpoint: "/predict" }),
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

Use `mountTabsForm()` when:

- your app already uses tabbed navigation
- users should move freely between sections
- you want built-in DOM instead of a custom shell

Use `createFormView()` with `layout.kind === "tabs"` when:

- the host app owns the chrome
- you need custom badges, counters, or side panels
- the visual treatment must match an existing component system
