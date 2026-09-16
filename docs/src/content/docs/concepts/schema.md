---
title: Schema
description: The form contract shared by UI, runtime, and backend code.
---

`FormSchema` names the inputs MLForm collects and the reports it expects back.

```ts
import type { FormSchema } from "mlform/schema";

const schema: FormSchema = {
  fields: [
    { id: "age", kind: "number", label: "Age", min: 0, max: 120, required: true },
  ],
  reports: [{ id: "risk", kind: "classifier", label: "Risk" }],
};
```

Use stable `id` values in production. MLForm can derive ids from labels, but explicit ids are runtime handles for UI state, layout refs, validation, focus, tests, and analytics. Backend keys belong in `mappedTo`. Review, persistence, and export keys belong in `displayKey`; fields without one are omitted from `displayValues`. Labels are user-facing copy, not stable data keys.

Use `form.getField(id)` and `form.getReport(id)` only for runtime handles. Use `form.getFieldByDisplayKey(key)` for review/export fields and `form.getFieldByMappedTo(target, { backend })` for model-bound fields.

Core terms:

| Term | Meaning |
| --- | --- |
| field | One value collected from the user. |
| report | One model output shown after submit or fetch. |
| kind | Registry key that selects validation and descriptor behavior. |
| condition | Rule such as `hiddenWhen`, `disabledWhen`, or `readOnlyWhen`. |
| normalized schema | Runtime-ready schema after ids, defaults, reports, and registry checks are resolved. |
| inactive field | Hidden, disabled, or read-only field. Submit behavior depends on policy. |

Schema should describe meaning, not screen placement. Put grouping, steps, tabs, and review screens in layout.

## Registry-driven tooling

Use the same registry for runtime, diagnostics, and editor completion:

```ts
import { findUnknownKinds, toSchemaJsonSchema, validateSchema } from "mlform/schema";

const validation = validateSchema(input, registry);
const jsonSchema = toSchemaJsonSchema(registry);
const unknownKinds = findUnknownKinds(input, registry);
```

`validateSchema` returns normalized data or path-based issues. JSON Schema includes every field and report definition currently registered, including application plugins.
