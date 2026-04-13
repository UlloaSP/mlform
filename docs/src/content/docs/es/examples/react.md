---
title: React
description: Monta MLForm desde un componente React y limpialo al desmontar.
---

MLForm renderiza Web Components, asi que la integracion con React es un wrapper de ciclo de vida.

```tsx
import { useEffect, useRef } from "react";
import { createJsonTransport, mountForm, type MountedForm } from "mlform";

export function PredictionForm() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const mounted: MountedForm = mountForm(ref.current, {
      transport: createJsonTransport({ endpoint: "/api/predict" }),
      schema: {
        fields: [{ id: "prompt", kind: "text", label: "Prompt", required: true }],
        reports: [{ id: "prediction", kind: "classifier", label: "Prediction" }],
      },
    });

    return () => mounted.unmount();
  }, []);

  return <div ref={ref} />;
}
```
