# MLForm

[![CI Pipeline](https://github.com/UlloaSP/mlform/actions/workflows/ci.yml/badge.svg)](https://github.com/UlloaSP/mlform/actions/workflows/ci.yml)
[![Release](https://github.com/UlloaSP/mlform/actions/workflows/release.yml/badge.svg)](https://github.com/UlloaSP/mlform/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/mlform.svg)](https://www.npmjs.com/package/mlform)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Schema-driven forms for machine learning applications.

MLForm gives you a predictable UI layer between users and model backends. You describe inputs and reports with a schema, MLForm renders accessible Web Components, validates values, submits structured payloads, and displays model results in the same host container.

Version `0.1.8` is the current release in this repository.

## Why MLForm

Most ML product forms drift over time:

- the frontend shape stops matching the backend contract
- validation rules end up duplicated across components
- model outputs are rendered ad hoc in each screen
- design and accessibility regress when teams move fast

MLForm solves that by centering everything on an explicit schema and a transport layer.

Use it for:

- prediction forms
- scoring and approval tools
- forecasting dashboards
- internal review consoles
- embedded model workflows inside larger apps

## Install

For application usage:

```bash
npm install mlform
```

Import from the root package unless you specifically need a lower-level surface:

```ts
import { createJsonTransport, mountForm } from "mlform";
```

## Quick Start

Create a host element:

```html
<div id="prediction-form"></div>
```

Mount a form:

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

## What You Get

- Schema-driven fields, reports, conditions, defaults, and serialization
- Accessible Web Components for form inputs, submit actions, and result rendering
- Headless `createFormView()` API for custom layouts and app-owned rendering
- Official `mountWizardForm()` helper for step-based flows
- Built-in JSON transport plus composable transport middleware
- Headless engine APIs for custom orchestration and registries
- Runtime design system with themes, recipes, density, motion, and token overrides
- Extension points for custom field, report, and explanation kinds

Built-in fields:

- `text`
- `number`
- `boolean`
- `category`
- `date`
- `time-series`

Built-in reports:

- `classifier`
- `regressor`

Built-in themes:

- `neutral`
- `cobalt`
- `graphite`
- `sage`
- `sunset`

Built-in recipes:

- `default`
- `minimal`
- `soft`
- `contrast`

## Package Surfaces

| Surface                | Use it for                                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `mlform`               | Application-first API for mounting forms or building headless layouts with sensible defaults.                              |
| `mlform/kit`           | Explicit kit entrypoint with `mountForm`, `mountWizardForm`, `createFormView`, transport, labels, and lifecycle utilities. |
| `mlform/runtime`       | Headless state, validation, registries, hooks, conditions, and submission orchestration.                                   |
| `mlform/primitives`    | Web Component renderers and custom renderer registries.                                                                    |
| `mlform/design-system` | Themes, recipes, tokens, mode resolution, and host integration.                                                            |
| `mlform/transport`     | Transport composition, middleware, resilience policies, and orchestration helpers.                                         |

## Custom Domain Kinds

When built-in kinds are not enough, define your own field and report kinds without rewriting the normal rendering path.

```ts
import { createMlRegistryPack } from "mlform/builtins-ml";
import { defineFieldKind } from "mlform/runtime";
import { z } from "zod";

const registry = createMlRegistryPack().registry;

registry.registerField(
  defineFieldKind({
    kind: "score",
    schema: z.object({
      kind: z.literal("score"),
      id: z.string().optional(),
      label: z.string(),
      min: z.number().default(0),
      max: z.number().default(100),
    }),
    value: {
      default: () => 0,
      normalize: (value) => Number(value ?? 0),
      serialize: (value) => value,
    },
    validate: ({ value, config }) =>
      value < config.min || value > config.max ? ["Score out of range."] : [],
    render: {
      widget: "number",
      hints: ({ config }) => ({
        min: config.min,
        max: config.max,
        unit: "%",
      }),
    },
  }),
);
```

Stay at the declarative `define*Kind` layer unless you truly need fully custom rendering or low-level primitive behavior.

## Typical Flow

1. Define the schema with `fields` and `reports`.
2. Mount the form with `mountForm`.
3. Point the transport at your model endpoint or custom backend adapter.
4. Return normalized reports from the backend.
5. Customize theme, recipe, labels, or registries only where your product needs it.

## Headless Layouts

Use `createFormView()` when you want MLForm to own state and validation, but your app to own layout:

```ts
import { createFormView, createJsonTransport } from "mlform";

const view = createFormView({
  transport: createJsonTransport({ endpoint: "/api/predict" }),
  schema,
  layout: {
    kind: "wizard",
    steps: [
      { title: "Profile", children: [{ kind: "field", field: "name" }] },
      { title: "Review", children: [{ kind: "field", field: "email" }] },
    ],
  },
});
```

If you want a built-in step UI, use `mountWizardForm()` with the same layout config.

## Documentation

- Docs home: https://ulloasp.github.io/mlform/
- Quick start: https://ulloasp.github.io/mlform/getting-started/quick-start/
- Installation: https://ulloasp.github.io/mlform/getting-started/installation/
- Backend contract: https://ulloasp.github.io/mlform/guides/backend-contract/
- Transport guide: https://ulloasp.github.io/mlform/kit/transport/
- Headless kit: https://ulloasp.github.io/mlform/kit/headless-kit/
- Wizard layout: https://ulloasp.github.io/mlform/kit/wizard-layout/
- Design system: https://ulloasp.github.io/mlform/design-system/overview/
- API reference: https://ulloasp.github.io/mlform/reference/kit/
- Migration guide: https://ulloasp.github.io/mlform/migration/from-legacy-mlform/
- Versioning notes: https://ulloasp.github.io/mlform/support/versioning/

## Development

This repository uses Vite+. Do not use `npm`, `pnpm`, or `yarn` directly for workspace tasks in this repo.

Run the main package checks:

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
vp run typecheck
vp run build
vp run dev
```

The main package targets Node.js `>=24.9.0`.

## Release Notes

For `0.1.8`, use the repository release entry and the published docs as the source of truth:

- GitHub releases: https://github.com/UlloaSP/mlform/releases
- npm package: https://www.npmjs.com/package/mlform

## License

MIT
