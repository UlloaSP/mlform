---
title: Performance
description: Avoid unnecessary remounts and expensive validation paths.
---

Guidelines:

| Topic            | Recommendation                                                                |
| ---------------- | ----------------------------------------------------------------------------- |
| Mounting         | Mount once per host view and call `unmount()` on teardown.                    |
| Schemas          | Keep schema objects stable in framework components.                           |
| Subscriptions    | Use `subscribeSelector` for focused state reads.                              |
| State reads      | Prefer `getField(id)` or selectors over repeatedly pulling full `form.state`. |
| Async validation | Set `asyncValidationDebounceMs` for fields that call services.                |
| Time series      | Bound `maxPoints` for large model inputs.                                     |
| Reports          | Resolve only payloads the UI needs.                                           |

Avoid rebuilding the mounted form on every keystroke. Let field controllers own user input and use subscriptions for external UI.
