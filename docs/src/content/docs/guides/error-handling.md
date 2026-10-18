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

The application owns its transport, including HTTP error parsing. MLForm does not install a
default HTTP client. A transport can read backend `message` or FastAPI `detail` fields and throw
an `Error` with that text; the runtime exposes submission failures as `SubmitError`.

```json
{
  "message": "Model is temporarily unavailable."
}
```

Report payload failures are report-local: a single report can enter an error state without making the whole submit fail. Use this when multiple reports are resolved from one backend response.

A failed submission after validation puts reports in `error` with the failure message. Aborting
clears pending reports to `idle`; a retry starts loading again. Validation failures remain field
or form feedback and do not call the transport.
