---
title: Backend Contract
description: Shape requests and responses for MLForm transports.
---

Transports receive model values keyed by resolved `mappedTo` targets:

```json
{
  "modelValues": {
    "feature_key": "serialized value"
  }
}
```

Return explicit report envelopes:

```json
{
  "reports": [
    {
      "backend": "default",
      "mappedTo": "report_key",
      "status": "ready",
      "payload": { "value": "model output" }
    }
  ],
  "meta": {
    "model": "version"
  }
}
```

Use `request.displayValues` for review/export data keyed by `displayKey`; fields without `displayKey` are omitted. Use `request.modelValues` for backend/model data keyed by `mappedTo`. Field `id` remains a runtime handle for UI state.

These identities must be unambiguous. Schema normalization rejects duplicate `displayKey` values
and overlapping submission paths produced by `mappedTo`, `valuePath`, or custom definition hooks.
Both exact duplicates (`profile.name` twice) and parent/child overlaps (`profile` with
`profile.name`) fail before the runtime is created. Targets used only by separate backend routes
must still be unique because a snapshot without a backend includes every applicable target.

Use `createSubmissionSnapshot(form, options)` when an app needs the same records for review,
persistence, or export before submit. Snapshot records and their plain object and array containers
are frozen. Opaque values such as dates, maps, sets, binary views, and blobs are
cloned for isolation but retain their platform mutation APIs; clone a snapshot before adapting it
to a mutable application format.

Use `createMultiBackendSubmissionSnapshot(form, { backends })` when one visible form feeds several
models with different `mappedTo` keys. Use `executeMultiBackendPipeline({ form, backends })` when
one user action should submit each backend and keep per-backend results, report fetch outputs,
errors, skipped reports, and report contexts. Backend names must be non-empty and unique. Ordinary
failures follow `continueOnError`; cancellation always stops the remaining runs.

`ready` requires `payload`. `pending` carries optional report-specific context into client fetch. `skipped` records non-applicability as terminal state. Each envelope is addressed by its exact `(backend, mappedTo)` pair; malformed and legacy shapes fail submission.
