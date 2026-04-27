---
title: React
description: Mount MLForm from a React component and clean it up.
---

MLForm renders Web Components, so React integration is a lifecycle wrapper.

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
