---
title: Field and report controllers
description: Reference for FieldController and ReportController, the per-field and per-report handles of a form.
---

## FieldController

`form.getField(id)` or `form.fields[i]`.

| Member | Purpose |
| --- | --- |
| `id`, `kind`, `config` | Runtime id, kind, and normalized, frozen config. |
| `state` | `FieldStateSnapshot`, below. |
| `setValue(value)` | Normalizes, checks synchronous constraints, and marks the field touched. Throws for hidden, disabled, and read-only fields. |
| `blur()` | Marks the field touched. Does not validate by itself. |
| `validate()` | Runs synchronous checks and the kind's `validate`, which may be asynchronous. |
| `serialize()` | The model value, as the transport would receive it. |
| `reset()` | Back to the initial value. |
| `focus()` | No effect in the runtime; renderers handle focus. |
| `subscribe(listener)` | Called with each new field state. |

`FieldStateSnapshot`:

| Property | Meaning |
| --- | --- |
| `value`, `initialValue` | Runtime values. |
| `dirty` | The value differs from `initialValue`; setting the initial value again clears it. |
| `touched` | The user or code changed or blurred the field. |
| `valid`, `errors` | Current errors from constraints, validators, and external errors. |
| `status` | `idle`, `validating`, `valid`, or `invalid`. |
| `visible`, `disabled`, `readOnly` | Resolved from static flags and conditions. |

Built-in controls call `blur()` and then `validate()` when focus leaves a control. Locked fields get
their values from `defaultValue`, `initialValues`, drafts, or derived writes such as a mapped
category.

```ts
const humidity = mounted.form.getField("humidity");
humidity?.setValue(140);
humidity?.state.errors; // ["Maximum value is 100."]
```

Runtime controllers carry no render information. The view adds a `descriptor` to each field item.

## ReportController

`form.getReport(id)` or `form.reports[i]`.

| Member | Purpose |
| --- | --- |
| `id`, `kind`, `config` | Runtime id, kind, and normalized config. |
| `state` | `{ status, payload, error }`; status is `idle`, `loading`, `ready`, `skipped`, or `error`. |
| `canFetch` | Whether the kind defines `fetch`. |
| `fetch(request)` | Fetches when the report is idle; otherwise does nothing. |
| `refresh(request)` | Cancels a running fetch and fetches again. |
| `abort()` | Cancels a running fetch and returns to idle. |
| `subscribe(listener)` | Called with each new report state. |

Report states and routing are described in [Reports](/schema/reports/#envelopes-and-states);
fetching in [Report fetches](/guides/report-fetches/).
