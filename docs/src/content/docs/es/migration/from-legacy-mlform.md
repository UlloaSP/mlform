---
title: Desde MLForm Legacy
description: Mapea los ejemplos antiguos de la clase MLForm a la API mountForm actual.
---

Los ejemplos antiguos usaban una API con forma de clase:

```ts
const mlForm = new MLForm("/api/predict");
await mlForm.toHTMLElement(schema, container);
```

Usa `mountForm`:

```ts
const mounted = mountForm(container, {
  endpoint: "/api/predict",
  schema,
});
```

Mapa de migracion:

| Legacy                          | Actual                                                              |
| ------------------------------- | ------------------------------------------------------------------- |
| `new MLForm(url)`               | `mountForm(container, { endpoint: url, schema })`                   |
| `toHTMLElement(...)`            | `mountForm(...)`                                                    |
| coleccion `inputs`              | coleccion `fields`                                                  |
| coleccion `outputs`             | coleccion `reports`                                                 |
| `type` de campo                 | `kind` de campo                                                     |
| `title` de campo                | `label` de campo                                                    |
| callback `onSubmit`             | `hooks.afterSubmit`, `hooks.beforeSubmit` o `mounted.form.submit()` |
| estrategias `mlform/extensions` | definiciones de engine y primitive registries                       |

Schema legacy:

```ts
const oldSchema = {
  inputs: [{ type: "text", title: "Prompt" }],
  outputs: [{ type: "classifier", title: "Prediction" }],
};
```

Schema actual:

```ts
const schema = {
  fields: [{ kind: "text", label: "Prompt" }],
  reports: [{ kind: "classifier", label: "Prediction" }],
};
```
