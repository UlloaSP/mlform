---
title: Vanilla JavaScript
description: Mount MLForm without a frontend framework.
---

```html
<div id="prediction-form"></div>
<script type="module" src="/src/form.ts"></script>
```

```ts
import { mountForm } from "mlform";

const host = document.querySelector("#prediction-form");

if (!(host instanceof HTMLElement)) {
  throw new Error("Missing prediction form host.");
}

const mounted = mountForm(host, {
  endpoint: "/api/predict",
  schema,
});

window.addEventListener("beforeunload", () => mounted.unmount());
```

Mount once for the lifetime of the page or view.
