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
const mounted = mountForm(container, {
  endpoint: "/api/predict",
  schema,
});
```

Migration map:

| Legacy                         | Current                                                               |
| ------------------------------ | --------------------------------------------------------------------- |
| `new MLForm(url)`              | `mountForm(container, { endpoint: url, schema })`                     |
| `toHTMLElement(...)`           | `mountForm(...)`                                                      |
| `inputs` collection            | `fields` collection                                                   |
| `outputs` collection           | `reports` collection                                                  |
| field `type`                   | field `kind`                                                          |
| field `title`                  | field `label`                                                         |
| `onSubmit` callback            | `hooks.afterSubmit`, `hooks.beforeSubmit`, or `mounted.form.submit()` |
| `mlform/extensions` strategies | engine definitions and primitive registries                           |

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
