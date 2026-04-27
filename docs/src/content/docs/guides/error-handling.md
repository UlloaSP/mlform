---
title: Error Handling
description: Handle validation, submit, abort, and report errors.
---

MLForm separates validation errors from submit errors.

| Error                    | Cause                                                    |
| ------------------------ | -------------------------------------------------------- |
| `ValidationError`        | Submit attempted while the form is invalid.              |
| `SubmitError`            | Transport failed or backend returned an error.           |
| `SubmissionAbortedError` | Submit was aborted by unmount, reset, or explicit abort. |
| `RegistryError`          | Unknown field/report kind or duplicate registration.     |

The default transport uses backend `{ "message": "..." }` payloads when available.

```json
{
  "message": "Model is temporarily unavailable."
}
```

Report payload failures are report-local: a single report can enter an error state without making the whole submit fail. Use this when multiple reports are resolved from one backend response.
