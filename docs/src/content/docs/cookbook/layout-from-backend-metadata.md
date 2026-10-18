---
title: Layout from backend metadata
description: Turn server-provided grouping metadata into a validated layout without mixing it into the schema.
---

When a backend describes how fields are grouped, keep that description separate from the schema and
translate it into a layout in the client:

```ts
import type { FormLayoutConfig } from "mlform/view";

type ApiLayout = { steps: { id: string; title: string; fields: string[] }[] };

const toLayout = (api: ApiLayout): FormLayoutConfig => ({
  kind: "wizard",
  steps: api.steps.map((step) => ({
    id: step.id,
    title: step.title,
    children: step.fields.map((field) => ({ kind: "field", field })),
  })),
});
```

The layout is validated when the form is created. A step that names an unknown field, misses a
field, or repeats one throws, so creating the view is the check:

```ts
let layout: FormLayoutConfig | undefined;
try {
  layout = toLayout(apiLayout);
  createFormView({ schema, transport, layout }).dispose();
} catch (error) {
  console.warn("Ignoring invalid layout metadata", error);
  layout = undefined; // fall back to the default stacked layout
}
mountForm(container, { schema, transport, layout });
```

Field references use exact runtime ids. Explicit ids stay unchanged; make sure the backend uses
the same strings as the schema. See [Layout config](/view/layout-schema/) for every rule and error
message.
