---
title: Informes
description: Informes integrados classifier y regressor.
---

Los informes renderizan la salida del modelo despues del envio. Usa `mappedTo` para la clave de respuesta del backend.

```ts
const schema = {
  fields: [{ id: "prompt", kind: "text", label: "Prompt" }],
  reports: [
    { id: "prediction", kind: "classifier", label: "Prediction", mappedTo: "prediction" },
    { id: "score", kind: "regressor", label: "Score", unit: "pts", mappedTo: "score" },
  ],
};
```

`classifier` acepta `labels` y `showClassProbabilities`. `regressor` acepta `unit` y `precision`.

`mappedTo` acepta clave backend o posicion numerica:

```ts
{ id: "visible-score", kind: "regressor", mappedTo: "model_score" }
{ id: "first-output", kind: "regressor", mappedTo: 0 }
```
