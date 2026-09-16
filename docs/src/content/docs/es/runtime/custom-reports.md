---
title: Informes personalizados
description: Define tipos de informe con renderizado declarativo.
---

Usa `defineReportKind` para resolver payloads y devolver un arbol de presentacion pequeno.

```ts
import { z } from "zod";
import { createMlRegistryPack } from "mlform/builtins";
import { defineReportKind, registerDefinedReportKind } from "mlform/kit";
import { resolveMappedReportPayload } from "mlform/schema";

const riskSummaryReport = defineReportKind({
  kind: "risk-summary",
  schema: z.object({
    id: z.string().optional(),
    kind: z.literal("risk-summary"),
    label: z.string().optional(),
    mappedTo: z.union([z.string(), z.number()]).optional(),
  }),
  resolve: ({ report, result }) =>
    resolveMappedReportPayload(report, result, {
      aliases: ["old_risk_summary"],
      onAlias: (alias, target) => console.warn(`Alias ${alias} usado para ${target}`),
    }),
  render: {
    summary: ({ payload }) => ({
      title: payload.label ?? "Risk",
      value: payload.score,
      tone: payload.score > 0.8 ? "danger" : "neutral",
    }),
    content: ({ payload }) => [
      { type: "metric", label: "Score", value: payload.score },
      { type: "list", label: "Drivers", items: payload.drivers },
    ],
  },
});

const pack = createMlRegistryPack();
registerDefinedReportKind(pack.registry, pack.descriptorRegistry, riskSummaryReport);
```

Si `resolve` falla, solo ese informe queda en estado `error`.

Los informes con `fetch` reciben `request.reportContext` con `id`, `mappedTo` resuelto, backend, `modelValues`, `displayValues`, `meta` del submit y salida raw. Usa eso en vez de normalizar ids:

```ts
fetch: () => ({
  async submit(request) {
    return fetchDetails(request.reportContext?.targetKey, request.modelValues);
  },
});
```
