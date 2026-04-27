---
title: Hooks y lifecycle
description: Observa validación, submit, errores, aborts y cleanup.
---

```ts
const mounted = mountForm(container, {
  transport: createJsonTransport({ endpoint: "/api/predict" }),
  schema,
  hooks: {
    beforeValidate({ values }) {
      console.log(values);
    },
    afterValidate({ result }) {
      console.log(result.valid);
    },
    beforeSubmit({ serializedValues, signal }) {
      console.log(serializedValues, signal.aborted);
    },
    afterSubmit({ result }) {
      console.log(result.reports);
    },
    onSubmitError({ error }) {
      console.error(error);
    },
  },
});

mounted.unmount();
```

Al desmontar, MLForm aborta submits pendientes. Si montas otra instancia en el mismo container, la anterior se desmonta automáticamente.
