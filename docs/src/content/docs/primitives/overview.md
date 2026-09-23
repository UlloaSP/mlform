---
title: Primitives Overview
description: Renderer primitives that connect primitive descriptors to Web Components.
---

Primitives are the DOM layer below the kit. They read primitive descriptors and mount Web Components for fields, reports, form layout, errors, and submit controls.

Use primitives directly when:

- you use the MLForm engine but want your own kit wrapper
- you need to register custom Web Component renderers
- you want to embed MLForm in a host that manages its own design system attachment

Most applications should use `mountForm` from `mlform/kit`.

When rendering built-in ML field and report kinds directly, pair the headless registry from `mlform/builtins` with the presenter registry from `mlform/view`:

```ts
import { createBuiltinMlRegistry } from "mlform/builtins";
import { createBuiltinDescriptorRegistry } from "mlform/view";
import { mountPrimitiveForm } from "mlform/primitives";
import { createForm } from "mlform/runtime";

const form = createForm({ schema, transport, registry: createBuiltinMlRegistry() });
mountPrimitiveForm(container, form, {
  descriptorRegistry: createBuiltinDescriptorRegistry(),
});
```

`mountPrimitiveForm` expects an empty container by default. Pass `containerStrategy: "replace"` only when you explicitly want to replace existing host content and restore it on `unmount()`.

For an iframe container, load MLForm and call `mountPrimitiveForm` inside the iframe so its Web Components are registered in that document.
