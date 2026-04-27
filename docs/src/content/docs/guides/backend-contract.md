---
title: Backend Contract
description: Shape requests and responses for MLForm transports.
---

The default JSON transport sends:

```json
{
  "inputs": {
    "field_id": "serialized value"
  }
}
```

It expects any parseable response. The recommended response is:

```json
{
  "reports": {
    "report_id": {
      "value": "model output"
    }
  },
  "meta": {
    "model": "version"
  }
}
```

Use `createJsonTransport({ body })` when the backend needs a different request shape:

```ts
const transport = createJsonTransport({
  endpoint: "/api/predict",
  body(request) {
    return JSON.stringify({
      values: request.serializedValues,
      reportIds: request.reports.map((report) => report.id),
    });
  },
});
```

Use `createJsonTransport({ parse })` when the backend returns text, nested JSON, or a streaming gateway result.

Legacy `outputs` responses are compatibility behavior only. New backends should return `reports`.
