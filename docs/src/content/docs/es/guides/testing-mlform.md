---
title: Testing de MLForm
description: Prueba transport, mounted forms, hooks y custom fields.
---

Para unit tests, usa un transport falso.

```ts
const transport = {
  async submit(request) {
    return {
      reports: {
        prediction: { label: request.values.prompt ? "Ready" : "Empty" },
      },
    };
  },
};
```

Para integración, monta en un `HTMLElement`, interactúa con el formulario y llama `mounted.unmount()` al final. Mockea `fetch` solo si estás probando `createJsonTransport`; para lógica de negocio suele ser más claro pasar un transport explícito.
