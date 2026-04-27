---
title: Informes personalizados
description: Define reportes para payloads propios del backend.
---

Un `ReportDefinition` valida configuración, resuelve payload y describe un renderer.

```ts
const explanationReport = {
  kind: "explanation",
  schema,
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
```

Si `resolvePayload` falla, solo ese informe queda en estado `error`.
