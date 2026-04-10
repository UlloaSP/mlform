---
title: Vanilla JavaScript
description: Monta MLForm sin framework.
---

```ts
import { mountForm } from "mlform";

const container = document.querySelector("#prediction-form");
if (!container) throw new Error("Missing #prediction-form container.");

const mounted = mountForm(container as HTMLElement, {
  endpoint: "/api/predict",
  schema,
});

window.addEventListener("beforeunload", () => mounted.unmount());
```

Monta una vez cuando el elemento existe y desmonta cuando la página o vista termina.
