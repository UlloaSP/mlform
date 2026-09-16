---
title: From Legacy MLForm
description: Map the old MLForm class examples to the current mountForm API.
---

Older examples used a class-shaped API:

```ts
const mlForm = new MLForm("/api/predict");
await mlForm.toHTMLElement(schema, container);
```

Use `mountForm` instead:

```ts
import { mountForm } from "mlform/kit";
import { predictionTransport } from "../examples/prediction-transport";

const mounted = mountForm(container, {
  transport: predictionTransport,
  schema,
});
```

Migration map:

| Legacy                         | Current                                                               |
| ------------------------------ | --------------------------------------------------------------------- |
| `new MLForm(url)`              | An application-owned `Transport` plus `mountForm(...)`                |
| `toHTMLElement(...)`           | `mountForm(...)`                                                      |
| `inputs` collection            | `fields` collection                                                   |
| `outputs` collection           | `reports` collection                                                  |
| field `type`                   | field `kind`                                                          |
| field `title`                  | field `label`                                                         |
| `onSubmit` callback            | Hooks or `mounted.form.submit()`                                      |
| `mlform/extensions` strategies | Definitions and presenters packaged through `defineMLFormPlugin(...)` |

Legacy schema:

```ts
const oldSchema = {
  inputs: [{ type: "text", title: "Prompt" }],
  outputs: [{ type: "classifier", title: "Prediction" }],
};
```

Current schema:

```ts
const schema = {
  fields: [{ kind: "text", label: "Prompt" }],
  reports: [{ kind: "classifier", label: "Prediction" }],
};
```

The current transport contract is deliberately small:

```ts
const transport = {
  async submit(request) {
    return callBackend(request.modelValues, { signal: request.signal });
  },
};
```

There are no built-in HTTP, streaming, retry, cache, tracing, or circuit-breaker layers to migrate.
Keep those concerns in the application client that implements `submit`.
