---
title: Architecture
description: How MLForm separates form state, rendering, transport, and styling.
---

MLForm is split into four public surfaces.

| Surface       | Import                   | Responsibility                                           |
| ------------- | ------------------------ | -------------------------------------------------------- |
| Kit           | `mlform` or `mlform/kit` | Default mount path for applications.                     |
| Engine        | `mlform/engine`          | State, validation, registry, hooks, and submit flow.     |
| Primitives    | `mlform/primitives`      | Built-in Web Components and primitive renderer registry. |
| Design system | `mlform/design-system`   | Themes, recipes, token resolution, and host integration. |

Use the kit for application code. It now exposes four app-facing paths:

- `mountForm()`, `mountWizardForm()`, `mountTabsForm()`, and `mountAccordionForm()` for built-in DOM layouts
- `createFormView()` for headless layout control without dropping to `mlform/engine`

Drop to engine or primitives only when building custom renderers, registries, or integration layers.

```ts
import { createJsonTransport, mountForm } from "mlform";
import type { FormSchema } from "mlform/engine";

const schema: FormSchema = {
  fields: [{ kind: "text", label: "Prompt" }],
};

mountForm(container, {
  transport: createJsonTransport({ endpoint: "/predict" }),
  schema,
});
```

For custom layouts, the flow is:

```ts
createFormView({ schema, transport, layout })
  -> validated layout tree
  -> render-ready collections
  -> wizard, tabs, or accordion layout helpers when applicable
```
