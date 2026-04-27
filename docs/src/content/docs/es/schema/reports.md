---
title: Informes
description: Informes integrados classifier y regressor.
---

Los informes renderizan la salida del modelo despues del envio. La respuesta recomendada usa un objeto `reports` indexado por el id del informe.

```ts
const schema = {
  fields: [{ id: "prompt", kind: "text", label: "Prompt" }],
  reports: [
    { id: "prediction", kind: "classifier", label: "Prediction" },
    { id: "score", kind: "regressor", label: "Score", unit: "pts" },
  ],
};
```

`classifier` acepta `labels` y `details`. `regressor` acepta `unit` y `precision`.

Usa `source` cuando la clave del backend no coincida con el id:

```ts
{ id: "visible-score", kind: "regressor", source: "model_score" }
```
