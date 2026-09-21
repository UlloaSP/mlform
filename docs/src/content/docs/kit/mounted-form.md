---
title: Mounted Form
description: The handle returned by mountForm.
---

`mountForm` returns a `MountedForm`. Keep it when the host app needs cleanup, direct engine access, or design system updates.

| Property or method              | Type                   | Purpose                                               |
| ------------------------------- | ---------------------- | ----------------------------------------------------- |
| `form`                          | `FormController`       | Read values, validate, submit, reset, or subscribe.   |
| `host`                          | `HTMLElement`          | Mounted primitive host element.                       |
| `engineRegistry`                | `Registry`             | Field and report definitions used by this instance.   |
| `primitiveRegistry`             | `PrimitiveRegistry`    | Renderer mapping used by this instance.               |
| `designSystemRegistry`          | `DesignSystemRegistry` | Theme and recipe registry.                            |
| `designSystem`                  | `AttachedDesignSystem` | Attached stylesheet/controller.                       |
| `updateDesignSystem(config)`    | `void`                 | Merge design system changes.                          |
| `replaceDesignSystem(snapshot)` | `void`                 | Replace mode, theme, recipe, and overrides.           |
| `resetDesignSystem()`           | `void`                 | Restore kit defaults.                                 |
| `suspend(reason?)`              | `void`                 | Preserve state and stop accepting work temporarily.   |
| `resume()`                      | `void`                 | Continue from a suspended state.                      |
| `unmount()`                     | `void`                 | Abort submit, disconnect styles, and remove the host. |

```ts
import { predictionTransport } from "./prediction-transport";

const mounted = mountForm(container, {
  transport: predictionTransport,
  schema,
});

mounted.form.subscribe((state) => {
  console.log(state.operation, state.submissionStatus, state.valid);
});

window.addEventListener("beforeunload", () => mounted.unmount());
```

Calling `mountForm` again on the same container unmounts the previous MLForm instance before mounting the next one.

Use `hostLifecycle: "document"` to connect the mounted form to document visibility and page
hide/show events. This mode suspends pending work when the page is hidden and resumes when it is
visible. The default is `"manual"`; call `mounted.suspend()` and `mounted.resume()` when another
host, router, or application shell owns visibility.

Pass `initialSnapshot` to restore a draft before the first rendered form state is published:

```ts
const saved = JSON.parse(localStorage.getItem("prediction-draft") ?? "null");

const mounted = mountForm(container, {
  schema,
  transport: predictionTransport,
  initialSnapshot: saved ?? undefined,
});
```

Use `mounted.form.createSnapshot()` for later saves. The runtime validates storage data during
restoration; the host should remove or replace a rejected snapshot.
