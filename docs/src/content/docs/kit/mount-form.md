---
title: mountForm
description: Mount MLForm into a host element with kit defaults.
---

`mountForm(container, options)` creates the engine form, mounts primitive Web Components, attaches the design system, and returns a mounted handle.

```ts
import { mountForm } from "mlform/kit";
import { predictionTransport } from "./prediction-transport";

const mounted = mountForm(container, {
  transport: predictionTransport,
  schema,
  initialValues: { age: 42 },
  labels: { submit: "Predict" },
  layout: { kind: "split" },
  reportPane: "auto",
  reportFetchMode: "all",
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
| `suspend(reason?)`              | Quiesce work while retaining the mounted form.                 |
| `resume()`                      | Resume a suspended mounted form.                               |
| `unmount()`                     | Abort pending submit, disconnect styling, and remove the host. |

Notes:

- Calling `mountForm` again on the same container automatically unmounts the previous MLForm instance first.
- `mountForm` expects an empty container by default.
- Pass `containerStrategy: "replace"` only when you want MLForm to replace existing host content and restore it on `unmount()`.
- `reportFetchMode` controls async reports after submit: `"lazy"` keeps renderer-driven fetches, `"all"` waits for all fetch-backed reports before success events, and `"none"` skips report fetches.
- Pass custom field and report kinds through `plugins`; kit registers their definitions, presenters, and behaviors together.
- Set `hostLifecycle: "document"` to suspend on hidden/pagehide and resume on visible/pageshow. The default `"manual"` leaves host lifecycle control to the application.
