---
title: Backend Contract
description: Shape requests and responses for MLForm transports.
---

The default JSON transport sends model values keyed by resolved `mappedTo` targets:

```json
{
  "inputs": {
    "feature_key": "serialized value"
  }
}
```

It expects any parseable response. The recommended response is:

```json
{
  "reports": {
    "report_key": {
      "value": "model output"
    }
  },
  "meta": {
    "model": "version"
  }
}
```

Use `request.displayValues` for review/export data keyed by `displayKey`; fields without `displayKey` are omitted. Use `request.serializedValues` or `request.modelValues` for backend/model data keyed by `mappedTo`. Field `id` remains a runtime handle for UI state.

Use `createSubmissionSnapshot(form, options)` when an app needs the same records for review, persistence, or export before submit.

Use `createMultiBackendSubmissionSnapshot(form, { backends })` when one visible form feeds several models with different `mappedTo` keys. Use `executeMultiBackendPipeline({ form, backends })` when one user action should submit each backend and keep per-backend results, report fetch outputs, errors, skipped reports, and report contexts. `createFanoutTransport` is still transport-level fanout; it does not resolve schema mappings per backend.

Use `createJsonTransport({ body })` when the backend needs a different request shape:

```ts
const transport = createJsonTransport({
  endpoint: "/api/predict",
  body(request) {
    return JSON.stringify({
      values: request.modelValues,
      reports: request.reports.map((report) => report.mappedTo),
    });
  },
});
```

Use `createJsonTransport({ parse })` when the backend returns text, nested JSON, or a streaming gateway result.

Legacy `outputs` responses are compatibility behavior only. New backends should return `reports`.
