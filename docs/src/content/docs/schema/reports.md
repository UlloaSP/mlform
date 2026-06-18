---
title: Reports
description: Built-in classifier and regressor reports.
---

Reports render model output after submit. Use `mappedTo` for the backend response key.
Keyed backend `reports` payloads and validated streamed report updates require `mappedTo`; MLForm fails the submit instead of guessing from report `id`.

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

Two reports cannot resolve to the same `mappedTo` target for the same backend.
