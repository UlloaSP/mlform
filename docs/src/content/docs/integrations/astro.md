---
title: Astro
description: Use MLForm on an Astro page.
---

MLForm needs browser APIs, so mount it from a client script.

```astro
<div id="prediction-form"></div>

<script>
  import { createJsonTransport, mountForm } from "mlform";

  const host = document.querySelector("#prediction-form");

  if (host instanceof HTMLElement) {
    mountForm(host, {
      transport: createJsonTransport({ endpoint: "/api/predict" }),
      schema: {
        fields: [{ id: "prompt", kind: "text", label: "Prompt", required: true }],
        reports: [{ id: "prediction", kind: "classifier", label: "Prediction" }],
      },
    });
  }
</script>
```

If you wrap MLForm in a framework island, follow that framework's cleanup lifecycle.
