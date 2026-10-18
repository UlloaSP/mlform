---
title: Live preview
description: Show the payload a model would receive, or any derived summary, while the user edits.
---

Subscribe to a narrow slice of state and render it outside the form:

```ts
import { createSubmissionSnapshot } from "mlform/runtime";

const mounted = mountForm(container, { schema, transport });
const preview = document.querySelector("#payload-preview")!;

const stop = mounted.form.subscribeSelector(
  (state) => state.values,
  () => {
    const { modelValues } = createSubmissionSnapshot(mounted.form);
    preview.textContent = JSON.stringify(modelValues, null, 2);
  },
  { emitInitial: true },
);

// When the preview goes away:
stop();
```

- `state.values` keeps its identity until a value changes, so the listener runs only on edits.
- `createSubmissionSnapshot` builds exactly what the transport would receive for active fields,
  including one-hot columns and series aggregations, without validating or submitting. Pass
  `{ backend }` to preview one backend's names.
- Values may be invalid while the user types; check `mounted.form.state.valid` before treating the
  preview as final.
- Debounce in your own code if the preview triggers expensive work.
