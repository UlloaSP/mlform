---
title: Form Controller
description: State, validation, submission, reset, and subscriptions.
---

`FormController` is the engine object behind every mounted MLForm.

| Member                                            | Purpose                                              |
| ------------------------------------------------- | ---------------------------------------------------- |
| `fields`                                          | Ordered field controllers.                           |
| `reports`                                         | Ordered report controllers.                          |
| `state`                                           | Current form state snapshot.                         |
| `getField(id)`                                    | Find one field.                                      |
| `getReport(id)`                                   | Find one report.                                     |
| `getValues()`                                     | Read current runtime values.                         |
| `setValues(values)`                               | Patch field values.                                  |
| `validate()`                                      | Run field and form validators.                       |
| `submit(options?)`                                | Validate, submit through transport, resolve reports. |
| `abortSubmit(reason?)`                            | Abort pending submit.                                |
| `reset()`                                         | Restore initial values and idle state.               |
| `subscribe(listener)`                             | Listen to complete form state.                       |
| `subscribeSelector(selector, listener, options?)` | Listen to a derived value.                           |

```ts
const unsubscribe = mounted.form.subscribeSelector(
  (state) => state.status,
  (status) => console.log(status),
  { emitInitial: true },
);

unsubscribe();
```

`submit()` throws `ValidationError`, `SubmitError`, or `SubmissionAbortedError` when the operation cannot complete.
