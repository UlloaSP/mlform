---
title: Schema Design
description: Design schemas that stay stable as models and products evolve.
---

Prefer explicit `id` values for every field and report. Labels are user-facing copy; ids are integration contracts.

```ts
{
  id: "customer_age",
  kind: "number",
  label: "Customer age",
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

Avoid changing field ids after a backend is deployed. If a model changes, add a new field id and migrate deliberately.
