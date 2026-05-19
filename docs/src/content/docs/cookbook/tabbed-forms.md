---
title: Tabbed Forms
description: Use the official tabs layout or the same config through a custom host.
---

Tabs are now an official built-in layout.

Fast path:

1. define `layout.kind = "tabs"`
2. use `mountForm()` for the built-in shell
3. switch to `createFormView()` only if the app needs custom chrome

```ts
const layout = {
  kind: "tabs",
  tabs: [
    {
      title: "Profile",
      children: [{ kind: "field", field: "name" }],
    },
    {
      title: "Details",
      children: [{ kind: "field", field: "email" }],
    },
  ],
};
```
