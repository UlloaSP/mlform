---
title: Labels
description: Textos visibles configurables en la capa kit.
---

```ts
mountForm(container, {
  transport: createJsonTransport({ endpoint: "/api/predict" }),
  schema,
  labels: {
    form: "Customer profile",
    reports: "Model output",
    submit: "Run prediction",
    validating: "Checking...",
    submitting: "Running...",
  },
});
```

| Label        | Uso                                     |
| ------------ | --------------------------------------- |
| `form`       | Label accesible del área de formulario. |
| `reports`    | Label accesible del área de informes.   |
| `submit`     | Texto del botón.                        |
| `validating` | Texto temporal durante validación.      |
| `submitting` | Texto temporal durante submit.          |

Traduce strings visibles, no nombres de API.
