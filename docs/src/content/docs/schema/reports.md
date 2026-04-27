---
title: Reports
description: Built-in classifier and regressor reports.
---

Reports render model output after submit. The recommended backend response uses a `reports` object keyed by report id.

```ts
const schema = {
  fields: [{ id: "prompt", kind: "text", label: "Prompt" }],
  reports: [
    { id: "prediction", kind: "classifier", label: "Prediction" },
    { id: "score", kind: "regressor", label: "Score", unit: "pts" },
  ],
};
```

`classifier` accepts optional `labels` and `details`. `regressor` accepts optional `unit` and `precision`.

Use `source` when the backend key differs from the report id:

```ts
{ id: "visible-score", kind: "regressor", source: "model_score" }
```
