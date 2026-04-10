---
title: Lifecycle
description: Work with mounted forms, hooks, validation, and cleanup.
---

Use hooks to observe validation and submit phases:

```ts
mountForm(container, {
  endpoint: "/api/predict",
  schema,
  hooks: {
    beforeSubmit({ serializedValues }) {
      console.log("Submitting", serializedValues);
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

Always call `mounted.unmount()` when the host app tears down the view.
