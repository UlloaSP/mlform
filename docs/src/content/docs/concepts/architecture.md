---
title: Architecture
description: The pieces MLForm uses before any API detail.
---

MLForm keeps seven jobs separate:

| Piece | Import | Owns |
| --- | --- | --- |
| Kit | `mlform/kit` | Application mounting, default UI wiring, layout helpers. |
| Runtime | `mlform/runtime` | State, validation, conditions, submit flow, report state. |
| Schema | `mlform/schema` | Field and report contracts shared by UI and backends. |
| Built-ins | `mlform/builtins` | Headless field/report definitions and the default schema registry. |
| Transport | `mlform/transport` | Backend request execution, fanout, and transport errors. |
| Primitives | `mlform/primitives` | Web Components that render fields, reports, errors, and submit controls. |
| Design system | `mlform/design` | Themes, recipes, tokens, host attachment. |

Most app code starts with `mountForm()` from the kit.

```ts
import { mountForm } from "mlform/kit";
import type { FormSchema } from "mlform/schema";
import { predictionTransport } from "./prediction-transport";

const schema: FormSchema = {
  fields: [{ id: "prompt", kind: "text", label: "Prompt" }],
};

mountForm(container, {
  schema,
  transport: predictionTransport,
});
```

Use `createFormView()` when MLForm should keep state and validation, but your app owns the visible layout. Use `createForm()` from runtime when there is no kit UI at all.

Kit is the composition root. It pairs headless built-in definitions with their presenters and runtime behaviors. Custom kinds enter through one `MLFormPlugin`; kit expands that plugin into the schema, presenter, and runtime registrations it owns internally.

The important boundary: schema says what the form means, layout says how it is arranged, transport says where submitted values go, primitives say which UI pieces render the field and report descriptors.
