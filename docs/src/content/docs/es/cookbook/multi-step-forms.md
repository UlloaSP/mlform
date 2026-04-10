---
title: Formularios multi-step
description: Flujos por pasos con condiciones y estado externo.
---

```ts
let step = "profile";

const schema = {
  fields: [
    { id: "name", kind: "text", label: "Name" },
    {
      id: "risk_details",
      kind: "text",
      label: "Risk details",
      hiddenWhen: () => step !== "risk",
    },
  ],
};
```

Para schemas servidos desde backend, usa condiciones declarativas en vez de funciones.
