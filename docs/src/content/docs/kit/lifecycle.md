---
title: Lifecycle
description: Work with mounted forms, hooks, validation, and cleanup.
---

Use hooks to observe validation and submit phases:

```ts
import { predictionTransport } from "./prediction-transport";

mountForm(container, {
  transport: predictionTransport,
  schema,
  hooks: {
    beforeSubmit({ modelValues }) {
      console.log("Submitting", modelValues);
    },
    afterSubmit({ result }) {
      console.log("Reports", result.reports);
    },
    onSubmitError({ error }) {
      console.error(error);
    },
  },
});
```

Use form validators for cross-field checks:

```ts
validators: [
  ({ values }) => {
    if (values.min > values.max) {
      return { fields: { max: ["Max must be greater than min."] } };
    }
  },
];
```

Always call `mounted.unmount()` when the host app tears down the view. Unmounting disposes the
headless runtime, aborts pending validation, submission, report, and behavior work, and removes
subscriptions. A directly-created headless form should call `form.dispose()` instead.
