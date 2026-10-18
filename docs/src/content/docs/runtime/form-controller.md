---
title: Form controller
description: Reference for FormController, the object behind every form, from createForm, createFormView, and mountForm.
---

You get a `FormController` from `createForm()`, as `view.form`, or as `mounted.form`.

## Members

| Member | Purpose |
| --- | --- |
| `fields`, `reports` | [Field and report controllers](/runtime/field-controller/), in schema order. |
| `state` | The current `FormState`. |
| `getField(id)`, `getReport(id)` | A controller by runtime id. |
| `getFieldByDisplayKey(key)` | A field by `displayKey`. |
| `getFieldByMappedTo(target, { backend }?)` | A field by model target. |
| `getValues()` | Current runtime values by id. |
| `setValues(values)` | Sets several values in one update; ids not in the schema throw. |
| `validate()` | Validates every active field and runs form validators. |
| `submit({ backend?, signal? })` | Validates, submits through the transport, and updates reports. |
| `abortSubmit(reason?)` | Aborts the running validation or submission. |
| `setExternalErrors({ form?, fields? })`, `clearExternalErrors()` | Errors from your code or server. |
| `reset()` | Initial values, no errors, idle reports, cleared submission outcome. |
| `createSnapshot()`, `restoreSnapshot(snapshot)` | [Drafts](/schema/initial-values/#save-and-restore-drafts). |
| `suspend(reason?)`, `resume()`, `dispose()` | [Lifecycle](/guides/hooks-and-lifecycle/). |
| `subscribe(listener)` | Called with every new state. |
| `subscribeSelector(selector, listener, { emitInitial?, equality? })` | Called when the selected value changes. |
| `subscribeTransitions(listener)` | Ordered lifecycle [transitions](/guides/hooks-and-lifecycle/#transitions). |

All `subscribe…` methods return an unsubscribe function.

```ts
const stop = mounted.form.subscribeSelector(
  (state) => [state.operation, state.submissionStatus] as const,
  ([operation, status]) => statusBadge.update(operation, status),
  { emitInitial: true },
);
```

The default `equality` is `shallowEquality` from `mlform/runtime`: arrays and plain objects are
compared one level deep, so selectors that return new tuples or objects only notify on real changes.
Pass your own `equality` for deeper structures.

## State

| Property | Meaning |
| --- | --- |
| `values` | Runtime values by field id. |
| `valid`, `dirty`, `touched` | Whether the whole form is valid, changed, or interacted with. |
| `errors` | `{ form: string[], fields: Record<id, string[]> }`. |
| `lifecycle`, `operation`, `submissionStatus` | The [state axes](/guides/hooks-and-lifecycle/#state-axes). |
| `submitCount` | Submissions started. |
| `reportStates` | `{ status, payload, error }` by report id. |
| `lastResult` | The `SubmitResult` of the latest submission when it succeeded; `null` before any success and after a failed or aborted one. |

State objects are deeply frozen and keep their identity until something changes. Normalized schema
objects passed to validators and transports are isolated, frozen copies; derive new objects instead
of changing them.

## Submission result

`submit()` resolves to a `SubmitResult`: `inputs`, `displayValues`, `modelValues`, `reports` (the
envelopes), `reportStates`, `reportContexts` (by report id), `meta`, `raw`, and `backend`.

It rejects with `ValidationError` (with `result.fields` and `result.formErrors`), `SubmitError`
(with `cause`), or `SubmissionAbortedError`. See [Errors](/guides/error-handling/).

## Concurrency rules

- One operation at a time: `validate()` during a submission, `submit()` during an explicit
  validation, or a second `submit()` throws `EngineError`.
- Validation and submission wait for pending asynchronous behaviors, so validators and the transport
  see settled values.
- Resetting or changing values while a submission is still validating aborts it.
- After a failed submission, reports show the error; after an abort, running reports return to
  `idle`; a retry moves them through `loading` again.
- While suspended, reads work and changes throw; after `dispose()`, every method that changes state
  throws.
