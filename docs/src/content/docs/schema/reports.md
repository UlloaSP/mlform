---
title: Reports
description: Built-in classifier and regressor reports.
---

Reports render model output after submit. `id` identifies the UI controller; `mappedTo` identifies backend output. They are independent.

```ts
const schema = {
  fields: [{ id: "prompt", kind: "text", label: "Prompt" }],
  reports: [
    { id: "prediction", kind: "classifier", label: "Prediction", mappedTo: "prediction" },
    { id: "score", kind: "regressor", label: "Score", unit: "pts", mappedTo: "score" },
  ],
};
```

`classifier` accepts optional `labels` and `showClassProbabilities`. `regressor` accepts optional `unit` and `precision`.

`mappedTo` accepts a backend key or numeric output position:

```ts
{ id: "visible-score", kind: "regressor", mappedTo: "model_score" }
{ id: "first-output", kind: "regressor", mappedTo: 0 }
```

Multiple report controllers may consume the same `(backend, mappedTo)` result.

Transports return one explicit envelope per backend output:

```ts
{
  backend: "risk-model",
  mappedTo: "model_score",
  status: "ready",
  payload: { value: 0.91 },
  context: {
    modelValues: { age: 42 },
    meta: { modelId: "risk-model" },
    raw: analyzerResponse,
  },
}
```

Use `pending` when MLForm must run the report's fetch transport with that context. Use `skipped` when the report is not applicable; `skipped` is terminal and is not fetched. Legacy objects that mix routing fields and payload fields are rejected.
