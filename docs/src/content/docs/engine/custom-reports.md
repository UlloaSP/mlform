---
title: Custom Reports
description: Define report kinds that understand custom backend payloads.
---

A custom report definition validates config, resolves payloads, and describes what a renderer should mount.

```ts
import { z } from "zod";
import { createBuiltinRegistry } from "mlform/engine";

const explanationReport = {
  kind: "explanation",
  schema: z.object({
    id: z.string().optional(),
    kind: z.literal("explanation"),
    label: z.string().optional(),
    source: z.string().optional(),
  }),
  resolvePayload: (config, context) => context.result.reports[config.source ?? config.id],
  describe: (config, context) => ({
    component: "explanation-report",
    props: {
      label: config.label ?? "Explanation",
      payload: context.payload,
      error: context.state.error,
    },
  }),
};

const registry = createBuiltinRegistry().registerReport(explanationReport);
```

If `resolvePayload` throws, MLForm marks only that report as `error`; the form submission can still complete for other reports.
