---
title: Informes personalizados
description: Define tipos de informe con renderizado declarativo.
---

Usa `defineReportKind` para resolver payloads y devolver un arbol de presentacion pequeno.

```ts
import { z } from "zod";
import { createMlRegistryPack } from "mlform/builtins-ml";
import { defineReportKind, registerDefinedReportKind } from "mlform/presentation";

const riskSummaryReport = defineReportKind({
  kind: "risk-summary",
  schema: z.object({
    id: z.string().optional(),
    kind: z.literal("risk-summary"),
    label: z.string().optional(),
    source: z.string().optional(),
  }),
  resolve: ({ report, result }) => result.reports[report.source],
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
registerDefinedReportKind(pack.registry, pack.presentationRegistry, riskSummaryReport);
```

Si `resolve` falla, solo ese informe queda en estado `error`.
