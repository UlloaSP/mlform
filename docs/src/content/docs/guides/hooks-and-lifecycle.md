---
title: Hooks And Lifecycle
description: Observe validation, submission, errors, aborts, and cleanup.
---

Hooks run around validation and submit:

```ts
hooks: {
  beforeValidate({ values, submitCount }) {},
  afterValidate({ result }) {},
  beforeSubmit({ modelValues, signal }) {},
  afterSubmit({ result }) {},
  onSubmitError({ error }) {},
}
```

Hooks execute application behavior. Use `form.subscribeTransitions()` when an observer only needs
the ordered state changes for tracing, metrics, or debugging. Transition records exclude field
values and backend payloads by default.

Lifecycle rules:

| Situation                                         | Behavior                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| Mounting into a container that already has MLForm | The previous mounted form is unmounted first.                     |
| Calling `mounted.unmount()`                       | Pending submit is aborted and design system observers disconnect. |
| Calling `mounted.form.reset()`                    | Values and report state return to initial state.                  |
| Calling `mounted.form.abortSubmit(reason)`        | In-flight submit receives an abort signal.                        |
| Calling `mounted.suspend(reason)`                 | Pending work stops and mutations reject until `resume()`.         |
| Using `hostLifecycle: "document"`                | Hidden/pagehide suspends; visible/pageshow resumes.                |
| Aborting while `afterSubmit` is pending           | The completed result is invalidated and `submissionStatus` becomes `aborted`. |
| Resetting or changing values during `afterSubmit` | The obsolete submit rejects with `SubmissionAbortedError`.        |
| An error-observer hook throws                     | The primary outcome is preserved and `onListenerError` is called. |

Use hooks for analytics, logging, custom loading state, and backend tracing. Do not mutate DOM from hooks unless you own the host integration.

`afterReportFetch` and `onReportFetchError` are notifications: their failures do not replace the
report outcome. Supply `onListenerError` to observe those failures. `onSubmitError` follows the same
rule so that it cannot hide the transport, validation, or abort error it is reporting.
With `listenerErrorPolicy: "ignore"`, failures thrown by `onListenerError` itself are isolated so
they cannot interrupt later listeners or turn a committed state change into a caller-visible
failure. The `throw-aggregate` policy includes both listener and observer failures in its final
aggregate.
