---
title: React
description: Mount MLForm from React with cleanup.
---

```tsx
import { useEffect, useMemo, useRef } from "react";
import { createJsonTransport, mountForm, type MountedForm } from "mlform";
import type { FormSchema } from "mlform/schema";

export function PredictionForm() {
  const hostRef = useRef<HTMLDivElement>(null);
  const schema = useMemo<FormSchema>(
    () => ({
      fields: [{ id: "prompt", kind: "text", label: "Prompt", required: true }],
      reports: [{ id: "prediction", kind: "classifier", label: "Prediction" }],
    }),
    [],
  );

  useEffect(() => {
    if (!hostRef.current) return;

    const mounted: MountedForm = mountForm(hostRef.current, {
      transport: createJsonTransport({ endpoint: "/api/predict" }),
      schema,
    });

    return () => mounted.unmount();
  }, [schema]);

  return <div ref={hostRef} />;
}
```

Do not recreate and remount on every render unless the schema really changed.
