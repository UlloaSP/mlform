---
title: Arquitectura
description: Las piezas de MLForm antes del detalle de API.
---

MLForm separa cinco trabajos:

| Pieza | Import | Se encarga de |
| --- | --- | --- |
| Kit | `mlform/kit` | Montaje en apps, UI por defecto, helpers de layout. |
| Runtime | `mlform/runtime` | Estado, validacion, condiciones, submit, estado de reports. |
| Schema | `mlform/schema` | Contratos de campos y reports compartidos por UI y backend. |
| Primitives | `mlform/primitives` | Web Components para campos, reports, errores y submit. |
| Design system | `mlform/design-system` | Themes, recipes, tokens e integracion con el host. |

La mayoria de apps empieza con `mountForm()` desde kit.

```ts
import { mountForm } from "mlform/kit";
import type { FormSchema } from "mlform/schema";
import { createJsonTransport } from "mlform/transport";

const schema: FormSchema = {
  fields: [{ id: "prompt", kind: "text", label: "Prompt" }],
};

mountForm(container, {
  schema,
  transport: createJsonTransport({ endpoint: "/predict" }),
});
```

Usa `createFormView()` cuando MLForm debe mantener estado y validacion, pero tu app pinta el layout. Usa `createForm()` desde runtime cuando no quieres la UI del kit.

La frontera importante: schema dice que significa el formulario, layout dice como se organiza, transport dice adonde van los valores, presentation dice como se ven campos y reports.
