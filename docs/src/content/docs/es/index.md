---
title: MLForm
description: Formularios para machine learning basados en esquemas para aplicaciones web.
---

MLForm monta formularios validados desde un esquema, envia valores estructurados a un backend de machine learning y renderiza informes del modelo en el mismo elemento host.

```ts
import { mountForm } from "mlform/kit";
import { createJsonTransport } from "mlform/transport";

mountForm(document.querySelector("#prediction-form") as HTMLElement, {
  transport: createJsonTransport({ endpoint: "/api/predict" }),
  schema: {
    fields: [{ id: "prompt", kind: "text", label: "Prompt", required: true }],
    reports: [{ id: "prediction", kind: "classifier", label: "Prediction" }],
  },
});
```

<div class="card-grid">
  <div class="doc-card"><strong>Kit</strong>Monta formularios one-page, wizard, tabs o disclosure, o controla layouts propios mediante la API headless.</div>
  <div class="doc-card"><strong>Runtime</strong>Valida campos, gestiona estado, ejecuta hooks y envia datos mediante cualquier transporte.</div>
  <div class="doc-card"><strong>Primitives</strong>Renderiza Web Components integrados para campos, envio e informes.</div>
  <div class="doc-card"><strong>Design system</strong>Aplica themes, recipes, densidad, movimiento y overrides de tokens del host.</div>
</div>

Empieza con [Quick Start](./getting-started/quick-start/), despues revisa [Kit](./kit/headless-kit/), [Schema](./concepts/schema/) y [Kit Reference](./reference/kit/).
