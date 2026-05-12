---
title: Layout From Backend Metadata
description: Transform server-provided metadata into a FormLayoutConfig without mixing it into schema semantics.
---

Recommended shape:

- backend returns schema
- backend optionally returns layout metadata
- frontend converts metadata to `FormLayoutConfig`

Avoid embedding app-specific view rules into the raw field schema unless the rule is genuinely semantic.

Pseudo-transform:

```ts
const layout = {
  kind: "wizard",
  steps: apiLayout.steps.map((step) => ({
    id: step.id,
    title: step.title,
    children: step.fields.map((fieldId) => ({ kind: "field", field: fieldId })),
  })),
};
```

Validate immediately by passing it to `createFormView()`.
