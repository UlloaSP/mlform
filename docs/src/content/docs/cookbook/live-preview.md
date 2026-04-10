---
title: Live Preview
description: Subscribe to form state and render host-side previews.
---

```ts
const mounted = mountForm(container, { endpoint: "/api/predict", schema });

const unsubscribe = mounted.form.subscribeSelector(
  (state) => state.values,
  (values) => {
    preview.textContent = JSON.stringify(values, null, 2);
  },
  { emitInitial: true },
);
```

Use selector subscriptions for previews, summary panels, and analytics. Avoid expensive work on every keystroke; debounce in the host app when needed.
