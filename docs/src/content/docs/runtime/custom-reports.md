---
title: Custom Reports
description: Define report kinds with declarative rendering and low boilerplate.
---

Use `defineReportKind` for the normal extension path. It lets you resolve payloads and return a small descriptor tree instead of building a custom renderer for each report.

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
  resolve: ({ report, result }) => resolveMappedReportPayload(report, result),
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

`render.content` can return `text`, `metric`, `kv`, `list`, `table`, `badge`, `notice`, or `json` nodes. The built-in declarative renderer handles the normal layout for you.

If `resolve` throws, MLForm marks only that report as `error`; the form submission can still complete for other reports.

Use `defineReportDefinition` plus an explicit presenter or custom primitive renderer only when you need a fully custom visual contract.
