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
| `unmount()`                     | `void`                 | Abort submit, disconnect styles, and remove the host. |

```ts
const mounted = mountForm(container, { endpoint: "/api/predict", schema });

mounted.form.subscribe((state) => {
  console.log(state.status, state.valid);
});

window.addEventListener("beforeunload", () => mounted.unmount());
```

Calling `mountForm` again on the same container unmounts the previous MLForm instance before mounting the next one.
