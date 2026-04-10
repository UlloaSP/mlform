---
title: Formulario Basico
description: Un formulario pequeno que envia datos a un endpoint de prediccion.
---

```html
<div id="basic-form"></div>
```

```ts
import { mountForm } from "mlform";

mountForm(document.querySelector("#basic-form") as HTMLElement, {
  endpoint: "/api/predict",
  schema: {
    fields: [
      { id: "name", kind: "text", label: "Name", required: true },
      { id: "age", kind: "number", label: "Age", min: 0, max: 120 },
      {
        id: "department",
        kind: "category",
        label: "Department",
        options: ["Engineering", "Sales", "Support"],
      },
    ],
    reports: [{ id: "risk", kind: "classifier", label: "Risk" }],
  },
  labels: { submit: "Evaluate" },
});
```

El backend debe devolver `reports.risk` con el payload que debe mostrar el informe classifier.
