---
title: Explicaciones personalizadas
description: Define tipos de explicación con renderizado declarativo y mínimo boilerplate.
---

Usa `defineExplanationKind` cuando quieras un plugin de explicación con adaptador de fetch y un renderer integrado para el caso común.

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
            title: "Explicación fallida",
            body: state.error,
            tone: "danger",
          }
        : {
            type: "table",
            label: "Impacto de características",
            columns: ["feature", "score"],
            rows: result.top_features,
          },
  },
});

const pack = createMlRegistryPack();
registerDefinedExplanationKind(pack.registry, pack.presentationRegistry, shapExplanation);
```

`fetch` recibe la configuración normalizada y devuelve el transporte que usa el controlador de explicación. `render.content` retorna un árbol de presentación pequeño, por lo que no necesitas un renderer personalizado para tablas, avisos, listas, métricas o payloads JSON.

Usa el nivel bajo `defineExplanationDefinition` junto con un presenter explícito o `mlform/primitives` solo cuando la explicación necesite una UI completamente personalizada.
