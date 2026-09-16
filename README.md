# MLForm

[![CI](https://github.com/UlloaSP/mlform/actions/workflows/ci.yml/badge.svg)](https://github.com/UlloaSP/mlform/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/mlform.svg)](https://www.npmjs.com/package/mlform)
[![MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

MLForm is a schema-driven form runtime and Web Component kit for machine-learning products. Define inputs and reports once; MLForm handles normalization, validation, backend-facing values, submission state, and result rendering.

Use the complete UI from `mlform`, build your own UI on the headless runtime, or adopt the layers between those two points.

## Why another form library?

Most form libraries stop at collecting values. ML interfaces also need to keep model mappings, validation, asynchronous reports, loading states, and result rendering consistent with the backend contract.

MLForm exists so every screen does not invent that integration again. The schema stays the source of truth, transports remain replaceable, and rendering is optional. The project is MIT licensed; if its direction stops fitting your product, you can fork it or use only the lower-level packages.

## Installation

> [!NOTE]
> MLForm is pre-1.0. Public APIs may change between minor releases. Node-based consumers require Node.js 20.19 or newer; contributors need Node.js 24.15 or newer.

```bash
npm install mlform
```

## Quick start

Add a host element:

```html
<div id="prediction-form"></div>
```

Mount MLForm with a schema and any object implementing the transport contract:

```ts
import { mountForm } from "mlform";
import type { Transport } from "mlform/transport";

const transport: Transport = {
  async submit(request) {
    const response = await fetch("/api/predict", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        inputs: request.modelValues,
        reports: request.reports,
      }),
      signal: request.signal,
    });

    if (!response.ok) throw new Error(`Prediction failed: ${response.status}`);
    return response.json();
  },
};

const container = document.querySelector<HTMLElement>("#prediction-form");
if (!container) throw new Error("Missing #prediction-form container.");

const mounted = mountForm(container, {
  transport,
  schema: {
    fields: [
      { id: "prompt", kind: "text", label: "Prompt", required: true },
      {
        id: "threshold",
        kind: "number",
        label: "Confidence threshold",
        min: 0,
        max: 1,
        defaultValue: 0.75,
        mappedTo: "threshold",
      },
    ],
    reports: [
      {
        id: "prediction",
        kind: "classifier",
        label: "Prediction",
        mappedTo: "prediction",
      },
    ],
  },
  labels: { submit: "Run prediction" },
  designSystem: { mode: "auto", theme: "cobalt", recipe: "soft" },
});

window.addEventListener("beforeunload", () => mounted.unmount());
```

The backend returns explicit report results:

```json
{
  "reports": [
    {
      "backend": "default",
      "mappedTo": "prediction",
      "status": "ready",
      "payload": {
        "prediction": "Approved",
        "labels": ["Approved", "Rejected"],
        "probabilities": [0.91, 0.09]
      }
    }
  ],
  "meta": { "model": "credit-risk-v2" }
}
```

## Choose your level

| Package | Purpose |
| --- | --- |
| `mlform` | Application-facing alias of `mlform/kit`. |
| `mlform/kit` | Mounting, layouts, navigation, lifecycle, and declarative extensions. |
| `mlform/runtime` | Headless state, validation, conditions, hooks, and submission orchestration. |
| `mlform/schema` | Schema contracts, normalization, mappings, and registries. |
| `mlform/builtins` | Headless definitions for included field and report kinds. |
| `mlform/transport` | Transport contracts, request execution, errors, and fanout. |
| `mlform/primitives` | Web Component renderers and renderer registries. |
| `mlform/design` | Themes, recipes, tokens, density, motion, and host integration. |

## What is included?

- Accessible built-in fields and report renderers
- Headless runtime and form-view APIs
- Single-page, split, tabs, accordion, and wizard layouts
- Explicit display-value and model-value boundaries
- Custom field and report kinds through the normal registration path
- Themes, recipes, design tokens, forced-colors support, and host integration
- Replaceable transports for HTTP, local models, workers, or application-owned clients

## Some notes

MLForm is young. Expect the API to become smaller and more explicit before 1.0.

MLForm does not host models, prescribe a backend framework, or require its built-in UI. It owns the form contract and lifecycle; your application owns transport, authentication, deployment, and model execution.

## Documentation

Full documentation lives at [ulloasp.github.io/mlform](https://ulloasp.github.io/mlform/).

- [Installation](https://ulloasp.github.io/mlform/getting-started/installation/)
- [Quick start](https://ulloasp.github.io/mlform/getting-started/quick-start/)
- [Backend contract](https://ulloasp.github.io/mlform/guides/backend-contract/)
- [Headless kit](https://ulloasp.github.io/mlform/kit/headless-kit/)
- [Design system](https://ulloasp.github.io/mlform/design/overview/)
- [Package exports](https://ulloasp.github.io/mlform/reference/package-exports/)

The current architecture is available as an [interactive diagram](./architecture/mlform-system.architecture.html).

## Contributing

MLForm uses [Vite+](https://viteplus.dev/guide/) for dependency management, checks, tests, and builds.

Install `vp`:

### macOS / Linux

```bash
curl -fsSL https://vite.plus | bash
```

### Windows

```powershell
irm https://vite.plus/ps1 | iex
```

Then install and verify the repository:

```bash
vp install
vp check
vp run typecheck
vp test run
vp build
```

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening an issue or pull request.

## License

MIT
