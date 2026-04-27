---
title: Events
description: Submit lifecycle events emitted by primitive form elements.
---

| Event                | Detail                                                    |
| -------------------- | --------------------------------------------------------- |
| `mlf-submit-request` | User requested submit. Cancelable by the primitive layer. |
| `mlf-submit-start`   | `{ form, state }` after submission starts.                |
| `mlf-submit-success` | `{ form, state, result }` after successful submit.        |
| `mlf-submit-abort`   | Abort notification for a canceled submit.                 |
| `mlf-submit-error`   | `{ form, state, error, status }` after a failed submit.   |

```ts
mounted.host.addEventListener("mlf-submit-success", (event) => {
  const detail = (event as CustomEvent).detail;
  console.log(detail.result.meta);
});
```

Prefer engine hooks for business logic. Use primitive events when integrating with host DOM systems.
