---
title: Architecture
description: The pieces MLForm uses before any API detail.
---

MLForm keeps five jobs separate:

| Piece | Import | Owns |
| --- | --- | --- |
| Kit | `mlform/kit` | Application mounting, default UI wiring, layout helpers. |
| Runtime | `mlform/runtime` | State, validation, conditions, submit flow, report state. |
| Schema | `mlform/schema` | Field and report contracts shared by UI and backends. |
| Primitives | `mlform/primitives` | Web Components that render fields, reports, errors, and submit controls. |
| Design system | `mlform/design-system` | Themes, recipes, tokens, host attachment. |

Most app code starts with `mountForm()` from the kit.

```ts
import { mountForm } from "mlform/kit";
import type { FormSchema } from "mlform/schema";
import { createJsonTransport } from "mlform/transport";

const schema: FormSchema = {
  fields: [{ id: "prompt", kind: "text", label: "Prompt" }],
};

mountForm(container, {
  schema,
  transport: createJsonTransport({ endpoint: "/predict" }),
});
```

Use `createFormView()` when MLForm should keep state and validation, but your app owns the visible layout. Use `createForm()` from runtime when there is no kit UI at all.

The important boundary: schema says what the form means, layout says how it is arranged, transport says where submitted values go, presentation says how fields and reports look.
