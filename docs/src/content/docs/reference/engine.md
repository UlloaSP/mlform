---
title: Runtime Reference
description: Form state, validation, submit flow, and registries.
---

Import each operation from its owning package surface:

| Import path | Exports |
| --- | --- |
| `mlform/runtime` | `createForm`, `EngineError`, `RegistryError`, `ValidationError`, `SubmitError`, `SubmissionAbortedError` |
| `mlform/schema` | `createRegistry`, `normalizeSchema` |
| `mlform/builtins` | `createBuiltinMlRegistry`, `calculateSeriesAggregation`, `getSeriesCellErrors` |

Runtime types include `FormController`, `FieldController`, `ReportController`, `FormHooks`,
`FormValidator`, and `SubmitResult`.

Import `FormSchema`, `FieldConfig`, and `ReportConfig` from `mlform/schema`, and `Transport` from
`mlform/transport` when an integration needs those layer contracts directly.

Use this layer when you need to drive form state without the default primitive UI.
