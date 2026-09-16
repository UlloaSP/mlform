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
| `getFieldByDisplayKey(key)`                       | Find a field by its UI-facing key.                   |
| `getFieldByMappedTo(target, options?)`             | Find a field by an explicit backend target.          |
| `getReport(id)`                                   | Find one report.                                     |
| `getValues()`                                     | Read current runtime values.                         |
| `setValues(values)`                               | Patch field values.                                  |
| `validate()`                                      | Run field and form validators.                       |
| `submit(options?)`                                | Validate, submit through transport, resolve reports. |
| `abortSubmit(reason?)`                            | Abort pending submit.                                |
| `setExternalErrors(issue)`                        | Apply server or host validation errors.              |
| `clearExternalErrors()`                           | Remove errors supplied by the host.                  |
| `reset()`                                         | Restore initial values and idle state.               |
| `dispose()`                                       | Abort pending work and release subscriptions.        |
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

State snapshots are deeply frozen and retain their identity until runtime state changes. Unknown
field ids passed to `setExternalErrors` fail atomically instead of partially applying errors.

Validation and submission wait for pending asynchronous runtime behaviors, so validators and
transports observe the resulting stable values. A direct `validate()` call while `submit()` is
active throws `EngineError`, and `submit()` does the same while an explicit validation is active;
this prevents one operation from overwriting the other's form status.

`submit()` throws `ValidationError`, `SubmitError`, or `SubmissionAbortedError` when the operation
cannot complete. Resetting the form or changing values while submission is still waiting for
validation aborts that submission.
