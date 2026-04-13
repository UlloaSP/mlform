---
title: MLForm
description: Formularios para machine learning basados en esquemas para aplicaciones web.
---

MLForm monta formularios validados desde un esquema, envia valores estructurados a un backend de machine learning y renderiza informes del modelo en el mismo elemento host.

```ts
import { createJsonTransport, mountForm } from "mlform";

mountForm(document.querySelector("#prediction-form") as HTMLElement, {
  transport: createJsonTransport({ endpoint: "/api/predict" }),
  schema: {
    fields: [{ id: "prompt", kind: "text", label: "Prompt", required: true }],
    reports: [{ id: "prediction", kind: "classifier", label: "Prediction" }],
  },
});
```

<div class="card-grid">
  <div class="doc-card"><strong>Kit</strong>Monta formularios con transporte, primitives, etiquetas y sistema de diseño por defecto.</div>
  <div class="doc-card"><strong>Engine</strong>Valida campos, gestiona estado, ejecuta hooks y envia datos mediante cualquier transporte.</div>
  <div class="doc-card"><strong>Primitives</strong>Renderiza Web Components integrados para campos, envio e informes.</div>
  <div class="doc-card"><strong>Design system</strong>Aplica themes, recipes, densidad, movimiento y overrides de tokens del host.</div>
</div>

Empieza con [Quick Start](./getting-started/quick-start/), despues revisa [Schema](./concepts/schema/) y [Kit Reference](./reference/kit/).
