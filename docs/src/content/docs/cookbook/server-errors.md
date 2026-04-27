---
title: Server Errors
description: Return useful backend failures and recover in the UI.
---

A backend can return a non-2xx response with a JSON message.

```json
{
  "message": "The model is warming up. Try again in a few seconds."
}
```

Use `hooks.onSubmitError` for host notifications.

```ts
mountForm(container, {
  transport: createJsonTransport({ endpoint: "/api/predict" }),
  schema,
  hooks: {
    onSubmitError({ error }) {
      console.error("Prediction failed", error);
    },
  },
});
```

Keep validation errors close to fields when they are known before submit. Use server errors for backend availability, authorization, malformed responses, and model failures.
