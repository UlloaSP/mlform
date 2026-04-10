---
title: Overview del engine
description: Usa MLForm sin la UI del kit cuando necesitas control headless.
---

El engine mantiene schema normalizado, estado de campos, validación, condiciones, submit, informes y suscripciones.

```ts
import { createBuiltinRegistry, createForm } from "mlform/engine";

const form = createForm({
  schema,
  registry: createBuiltinRegistry(),
  transport: {
    async submit(request) {
      return {
        reports: {
          prediction: { label: request.values.prompt ? "Ready" : "Empty" },
        },
      };
    },
  },
});
```

Usa el kit por defecto. Baja al engine cuando quieras tu propio renderer o integración no DOM.
