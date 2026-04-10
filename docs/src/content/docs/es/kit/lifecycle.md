---
title: Ciclo De Vida
description: Trabaja con formularios montados, hooks, validacion y limpieza.
---

Usa hooks para observar validacion y envio:

```ts
mountForm(container, {
  endpoint: "/api/predict",
  schema,
  hooks: {
    beforeSubmit({ serializedValues }) {
      console.log("Submitting", serializedValues);
    },
    afterSubmit({ result }) {
      console.log("Reports", result.reports);
    },
    onSubmitError({ error }) {
      console.error(error);
    },
  },
});
```

Usa validadores para reglas entre campos:

```ts
validators: [
  ({ values }) => {
    if (values.min > values.max) {
      return { fields: { max: ["Max must be greater than min."] } };
    }
  },
];
```

Llama siempre a `mounted.unmount()` cuando la aplicacion host destruye la vista.
