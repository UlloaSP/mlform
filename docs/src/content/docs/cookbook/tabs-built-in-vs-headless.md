---
title: Tabs Built-in vs Headless
description: Decide when to use mountTabsForm directly and when to render your own tabs UI on top of createFormView.
---

Choose `mountTabsForm()` when you want:

- built-in tab chrome
- built-in submit footer
- minimal host code
- MLForm primitives rendered for you

Choose `createFormView()` when you want:

- app-owned navigation
- custom badges, counters, or side panels
- different tabs on desktop and mobile
- a non-Lit host such as React or Vue

## Same layout config, different host path

```ts
const layout = {
  kind: "tabs",
  tabs: [
    { title: "Profile", children: [{ kind: "field", field: "name" }] },
    { title: "Results", children: [{ kind: "report", report: "risk" }] },
  ],
};
```

Built-in:

```ts
mountTabsForm(container, { schema, transport, layout });
```

Headless:

```ts
const view = createFormView({ schema, transport, layout });
const snapshot = view.getSnapshot();
```
