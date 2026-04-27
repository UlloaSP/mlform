---
title: Engine Reference
description: Form state, validation, submit flow, and registries.
---

Important exports from `mlform/engine`:

- `createForm`
- `createRegistry`
- `createBuiltinRegistry`
- `EngineRegistry`
- `EngineError`
- `RegistryError`
- `ValidationError`
- `SubmitError`
- `SubmissionAbortedError`

Important types:

- `FormSchema`
- `FieldConfig`
- `ReportConfig`
- `FormController`
- `FieldController`
- `ReportController`
- `Transport`
- `FormHooks`
- `FormValidator`
- `SubmitResult`

Use this layer when you need to drive form state without the default primitive UI.
