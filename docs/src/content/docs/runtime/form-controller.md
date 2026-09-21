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
| `suspend(reason?)`                                | Quiesce work while preserving form state.            |
| `resume()`                                        | Accept new work after suspension.                    |
| `dispose()`                                       | Abort pending work and release subscriptions.        |
| `subscribe(listener)`                             | Listen to complete form state.                       |
| `subscribeSelector(selector, listener, options?)` | Listen to a derived value.                           |
| `subscribeTransitions(listener)`                  | Listen to ordered lifecycle transitions.             |

```ts
const unsubscribe = mounted.form.subscribeSelector(
  (state) => [state.operation, state.submissionStatus] as const,
  ([operation, submissionStatus]) => console.log(operation, submissionStatus),
  { emitInitial: true },
);

unsubscribe();
```

Use transition subscriptions for telemetry and lifecycle debugging:

```ts
const unsubscribeTransitions = mounted.form.subscribeTransitions((transition) => {
  telemetry.record(transition.type, {
    sequence: transition.sequence,
    from: transition.from,
    to: transition.to,
    reason: transition.reason,
  });
});
```

Transition events cover validation, submission, reset, restoration, suspension, resumption, and disposal. Sequence numbers
increase for the lifetime of one form controller. Events contain lifecycle axes and submit counts,
without field values, payloads, or results. MLForm retains only the latest event required for
delivery; consumers that need history must store it themselves. Subscribing does not replay an
earlier transition.

State snapshots are deeply frozen and retain their identity until runtime state changes. Unknown
field ids passed to `setExternalErrors` fail atomically instead of partially applying errors.
Normalized schema snapshots passed to form validators and transports are isolated from the
runtime and deeply frozen for ordinary schema objects and arrays. Treat them as contract metadata;
derive a separate object when an integration needs to transform them.

Validation and submission wait for pending asynchronous runtime behaviors, so validators and
transports observe the resulting stable values. A direct `validate()` call while `submit()` is
active throws `EngineError`, and `submit()` does the same while an explicit validation is active;
this prevents one operation from overwriting the other's state.

Form state uses three independent lifecycle axes:

| Axis | Values | Meaning |
| --- | --- | --- |
| `lifecycle` | `active`, `suspended`, `disposed` | Whether the controller accepts work, is temporarily quiescent, or is terminal. |
| `operation` | `idle`, `validating`, `submitting` | Work currently in progress. |
| `submissionStatus` | `idle`, `succeeded`, `failed`, `aborted` | Outcome of the latest submission attempt. |

Editing is represented by `dirty` and `touched`. A successful submission remains `succeeded`
while later field edits make the form dirty, until another submission starts or `reset()` clears
the outcome. Calling `dispose()` publishes `lifecycle: "disposed"` before subscriptions are released.

`suspend()` aborts and invalidates pending validation, submission, behavior, and report-fetch work
while preserving field values, interaction state, completed results, and subscriptions. Mutating
operations reject while suspended, but state and draft snapshots remain readable. `resume()` makes
the same controller active again without restarting aborted work. Both methods are idempotent.

`submit()` throws `ValidationError`, `SubmitError`, or `SubmissionAbortedError` when the operation
cannot complete. Resetting the form or changing values while submission is still waiting for
validation aborts that submission.

## Save and restore a draft

`createSnapshot()` returns a frozen, versioned draft containing field values and interaction state.
`restoreSnapshot()` checks the snapshot against the current field and report ids and kinds, prepares
the complete result, and then commits it as one state update:

```ts
const snapshot = form.createSnapshot();
localStorage.setItem("prediction-draft", JSON.stringify(snapshot));

const saved = localStorage.getItem("prediction-draft");
if (saved) form.restoreSnapshot(JSON.parse(saved));
```

Restoration cancels pending validation and submission work. It resets reports, submission outcome,
submit count, transient validation errors, and backend errors. Conditions and synchronous validation
are recalculated from restored values.

Snapshot values must be JSON-compatible. A custom field with another value type defines both
`serializeSnapshotValue` and `restoreSnapshotValue` on its field definition. Snapshot restoration
rejects unknown versions, missing fields, extra fields, and schema signature mismatches before
changing runtime state.

Use `saveFormSnapshot`, `restoreFormSnapshot`, and `removeFormSnapshot` from `mlform/runtime` with a
`FormPersistenceAdapter` when storage is asynchronous. Pass a previously loaded value as
`initialSnapshot` to `createForm` to restore it during construction.
