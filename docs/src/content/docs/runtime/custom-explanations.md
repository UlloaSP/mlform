---
title: Custom Explanations
description: Define explanation kinds with declarative rendering and low boilerplate.
---

Use `defineExplanationKind` when you want an explanation plugin with a fetch adapter and a built-in renderer for the normal case.

```ts
import { z } from "zod";
import { createMlRegistryPack } from "mlform/builtins-ml";
import { defineExplanationKind, registerDefinedExplanationKind } from "mlform/presentation";

const shapExplanation = defineExplanationKind({
  kind: "shap",
  schema: z.object({
    kind: z.literal("shap"),
    id: z.string().optional(),
    label: z.string().optional(),
  }),
  fetch: ({ config }) => ({
    submit: async (request) => {
      const response = await fetch(`/api/explanations/${config.kind}`, {
        method: "POST",
        body: JSON.stringify(request),
      });

      return response.json();
    },
  }),
  render: {
    summary: ({ state }) => ({
      title: "SHAP",
      tone: state.status === "error" ? "danger" : "neutral",
    }),
    content: ({ result, state }) =>
      state.error
        ? {
            type: "notice",
            title: "Explanation failed",
            body: state.error,
            tone: "danger",
          }
        : {
            type: "table",
            label: "Feature impact",
            columns: ["feature", "score"],
            rows: result.top_features,
          },
  },
});

const pack = createMlRegistryPack();
registerDefinedExplanationKind(pack.registry, pack.presentationRegistry, shapExplanation);
```

`fetch` receives the normalized config and returns the transport used by the explanation controller. `render.content` returns a small presentation tree, so you do not need a custom renderer for tables, notices, lists, metrics, or JSON payloads.

Use low-level `defineExplanationDefinition` plus an explicit presenter or `mlform/primitives` only when the explanation needs a fully custom UI.
