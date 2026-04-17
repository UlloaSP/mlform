# MLForm

[![CI Pipeline](https://github.com/UlloaSP/mlform/actions/workflows/ci.yml/badge.svg)](https://github.com/UlloaSP/mlform/actions/workflows/ci.yml)
[![Release](https://github.com/UlloaSP/mlform/actions/workflows/release.yml/badge.svg)](https://github.com/UlloaSP/mlform/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/mlform.svg)](https://www.npmjs.com/package/mlform)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Schema-driven forms for machine learning workflows. MLForm mounts accessible Web Components, validates user input, sends serialized values to your model backend, and renders classifier or regressor reports from the response.

## Install

```bash
npm install mlform
```

## Quick Start

```html
<div id="prediction-form"></div>
```

```ts
import { createJsonTransport, mountForm } from "mlform";

const container = document.querySelector("#prediction-form");

if (!container) {
  throw new Error("Missing #prediction-form container.");
}

const mounted = mountForm(container as HTMLElement, {
  transport: createJsonTransport({ endpoint: "/api/predict" }),
  schema: {
    fields: [
      {
        id: "prompt",
        kind: "text",
        label: "Prompt",
        required: true,
        minLength: 3,
      },
      {
        id: "threshold",
        kind: "number",
        label: "Confidence threshold",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.75,
      },
    ],
    reports: [
      {
        id: "prediction",
        kind: "classifier",
        label: "Prediction",
      },
    ],
  },
  labels: {
    submit: "Run prediction",
    submitting: "Running...",
  },
  layout: "split",
  designSystem: {
    mode: "auto",
    theme: "cobalt",
    recipe: "soft",
  },
});

window.addEventListener("beforeunload", () => mounted.unmount());
```

The default JSON transport sends:

```json
{
  "inputs": {
    "prompt": "Example text",
    "threshold": 0.75
  }
}
```

Return reports keyed by report id:

```json
{
  "reports": {
    "prediction": {
      "label": "Approved",
      "confidence": 0.91,
      "probabilities": {
        "Approved": 0.91,
        "Rejected": 0.09
      }
    }
  },
  "meta": {
    "model": "credit-risk-v2"
  }
}
```

## Main Surfaces

| Surface       | Use it for                                                                                   |
| ------------- | -------------------------------------------------------------------------------------------- |
| Kit           | `mountForm`, default transport, labels, lifecycle, and design system attachment.             |
| Engine        | Headless state, validation, conditions, transport submission, registries, and subscriptions. |
| Primitives    | Web Component renderers and custom renderer registries.                                      |
| Design System | Themes, recipes, tokens, host integration, and runtime visual updates.                       |

Built-in fields: `text`, `number`, `boolean`, `category`, `date`, and `time-series`.

Built-in reports: `classifier` and `regressor`.

Built-in themes: `neutral`, `cobalt`, `graphite`, `sage`, and `sunset`.

Built-in recipes: `default`, `minimal`, `soft`, and `contrast`.

## Documentation

- Product docs: https://ulloasp.github.io/mlform/
- Quick start: https://ulloasp.github.io/mlform/getting-started/quick-start/
- Backend contract: https://ulloasp.github.io/mlform/guides/backend-contract/
- API reference: https://ulloasp.github.io/mlform/reference/kit/
- Migration guide: https://ulloasp.github.io/mlform/migration/from-legacy-mlform/

## Development

This repository uses Vite+.

```bash
vp install
vp check
vp test
vp build
```

Docs live in `docs/`:

```bash
cd docs
vp install
vp run dev
vp run build
```

## License

MIT
