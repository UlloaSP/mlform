---
title: React
description: Usa useRef y useEffect con cleanup.
---

```tsx
import { useEffect, useMemo, useRef } from "react";
import { mountForm } from "mlform";

export function PredictionForm() {
  const ref = useRef<HTMLDivElement>(null);
  const schema = useMemo(
    () => ({
      fields: [{ id: "prompt", kind: "text", label: "Prompt" }],
      reports: [{ id: "prediction", kind: "classifier", label: "Prediction" }],
    }),
    [],
  );

  useEffect(() => {
    if (!ref.current) return;
    const mounted = mountForm(ref.current, { endpoint: "/api/predict", schema });
    return () => mounted.unmount();
  }, [schema]);

  return <div ref={ref} />;
}
```

Evita reconstruir el schema en cada render salvo que quieras remount intencional.
