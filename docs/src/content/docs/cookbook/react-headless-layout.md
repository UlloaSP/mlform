---
title: React Headless Layout
description: Use createFormView from React while keeping MLForm in charge of form state and validation.
---

Typical pattern:

1. create the view in an effect or stable external module
2. keep the latest snapshot in React state
3. subscribe on mount
4. unsubscribe on unmount

```ts
import { createFormView } from "mlform/view";

useEffect(() => {
  const view = createFormView({ transport, schema, layout });
  setSnapshot(view.getSnapshot());
  const unsubscribe = view.subscribe(setSnapshot);
  return () => {
    unsubscribe();
    view.dispose();
  };
}, []);
```

Render recursively from `snapshot.layout`.

Use MLForm primitives for field and report rendering if you want host-owned layout but built-in controls.
