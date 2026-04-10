---
title: mountForm
description: Mount MLForm into a host element with kit defaults.
---

`mountForm(container, options)` creates the engine form, mounts primitive Web Components, attaches the design system, and returns a mounted handle.

```ts
import { mountForm } from "mlform";

const mounted = mountForm(container, {
  endpoint: "/api/predict",
  schema,
  initialValues: { age: 42 },
  labels: { submit: "Predict" },
  layout: "split",
  reportPane: "auto",
});
```

The returned object exposes:

| Property or method              | Use                                                            |
| ------------------------------- | -------------------------------------------------------------- |
| `form`                          | Access the `FormController`.                                   |
| `host`                          | Access the mounted Web Component host.                         |
| `updateDesignSystem(config)`    | Merge design system changes.                                   |
| `replaceDesignSystem(snapshot)` | Replace with an explicit mode, theme, and recipe.              |
| `resetDesignSystem()`           | Restore defaults.                                              |
| `unmount()`                     | Abort pending submit, disconnect styling, and remove the host. |
