---
title: Schema Design
description: Design schemas that stay stable as models and products evolve.
---

Prefer explicit `id` values for every field and report. They identify runtime state, layout
references, and validation errors. Labels are user-facing copy; `mappedTo` identifies backend
inputs and outputs, and `displayKey` identifies review or export values.

```ts
{
  id: "customer_age",
  kind: "number",
  label: "Customer age",
  displayKey: "customer_age",
  mappedTo: "age_years",
  min: 0,
  max: 120
}
```

Guidelines:

| Topic       | Recommendation                                                                     |
| ----------- | ---------------------------------------------------------------------------------- |
| Ids         | Use stable snake case or kebab case. Do not derive backend contracts from labels.  |
| Labels      | Write labels for users, not for machines.                                          |
| Required    | Use `required` for user obligations, not backend convenience.                      |
| Defaults    | Use `defaultValue` for schema-owned defaults and `initialValues` for session data. |
| UI metadata | Put renderer-specific hints in `ui`; do not make the backend depend on them.       |
| Versioning  | Version schemas at your API boundary when models change required inputs.           |

Keep ids stable when layouts or saved drafts depend on them. If a model renames a feature, update
its `mappedTo` deliberately; a backend rename does not require a new runtime id. MLForm does not
infer backend mappings from ids or labels.
