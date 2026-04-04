# MLForm

[![CI Pipeline](https://github.com/UlloaSP/mlform/actions/workflows/ci.yml/badge.svg)](https://github.com/UlloaSP/mlform/actions/workflows/ci.yml)
[![Release](https://github.com/UlloaSP/mlform/actions/workflows/release.yml/badge.svg)](https://github.com/UlloaSP/mlform/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/mlform.svg)](https://www.npmjs.com/package/mlform)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Composable form generation for machine learning workflows. MLForm turns JSON schemas into responsive web components, validates user input with Zod, and connects submissions to your predictive backend.

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Schema essentials](#schema-essentials)
- [Machine learning responses](#machine-learning-responses)
- [Extensibility](#extensibility)
- [Runtime utilities](#runtime-utilities)
- [Tooling & scripts](#tooling--scripts)
- [Documentation & resources](#documentation--resources)
- [Contributing](#contributing)
- [License](#license)

## Overview

MLForm is a TypeScript-first library that renders adaptive forms as standards-based Web Components built with Lit. Provide a predictable JSON schema, plug in your ML inference endpoint, and receive validated input alongside structured model responses. The library ships with batteries included for common field types and ML output strategies, while remaining extensible for custom domains.

## Features

- Dynamic rendering of form layouts driven by strongly typed JSON signatures
- Built-in integration with regression and classification endpoints via fetch
- Prepackaged strategies for text, number, boolean, category, and date inputs
- Subscription API (`onSubmit`) and accessors (`lastInputs`, `lastResponse`) for reactive UIs
- Lazy-loaded Web Components that stay framework-agnostic and usable in any SPA or vanilla app
- Zod-powered validation, JSON Schema generation, and type definitions out of the box

## Installation

```bash
npm install mlform
```

> Requirements: Node.js >= 22.14 and npm >= 9.

The package exposes ESM builds and bundled type declarations. Consumers can tree-shake imports such as `mlform`, `mlform/extensions`, and `mlform/strategies` with modern bundlers (Vite, Webpack, Rollup, etc.).

## Quick start

```typescript
import { MLForm } from "mlform";

const mlForm = new MLForm("https://api.example.com/predict");

const schema = {
	inputs: [
		{ type: "text", title: "Full Name", required: true },
		{ type: "number", title: "Age", min: 0, max: 120, required: true },
		{
			type: "category",
			title: "Department",
			options: ["Engineering", "Sales", "Marketing"],
			required: true,
		},
	],
	outputs: [{ type: "classifier", title: "Access Level" }],
};

mlForm.onSubmit((inputs, response) => {
	console.log("User inputs", inputs);
	console.log("Prediction", response);
});

const container = document.getElementById("form-container")!;
await mlForm.toHTMLElement(schema, container);
```

```html
<div id="form-container"></div>
<script type="module" src="./main.ts"></script>
```

MLForm mounts a custom `<ml-layout>` shell, injects the appropriate field components, and dispatches an `ml-submit` event internally when the user submits the form. Responses from your backend are automatically forwarded to registered listeners and mirrored in the report slot.

## Schema essentials

Schemas follow the `Signature` type exported from `mlform/core` (re-exported as `Signature` in the root package). Each entry is validated with Zod before rendering.

### Input field types

| Type | Description | Key options |
| --- | --- | --- |
| `text` | Single-line text input | `minLength`, `maxLength`, `pattern`, `placeholder`, `value` |
| `number` | Numeric input with constraints | `min`, `max`, `step`, `value` |
| `boolean` | Checkbox or toggle | `required` |
| `category` | Select or radio options | `options`, `multiple` |
| `date` | Date picker | `min`, `max`, `format`, `value` |

Every field shares a base structure of `title`, optional `description`, and an explicit `required` flag (defaulting to `true`).

### Model output types

| Type | Use case | Typical payload |
| --- | --- | --- |
| `classifier` | Discrete predictions | `prediction`, `confidence`, `probabilities`, `execution_time` |
| `regressor` | Continuous predictions | `prediction`, `confidence_interval`, `std_deviation`, `execution_time` |

You can combine multiple outputs within the same schema to present downstream analytics alongside user inputs.

## Machine learning responses

During submission MLForm issues a POST request to the backend URL configured in the constructor. The body contains the normalized user inputs and the requested model metadata. Responses are projected into the report slot and emitted to listeners.

```json
// Request payload
{
	"inputs": {
		"Full Name": "Jane Doe",
		"Age": 34,
		"Department": "Engineering"
	}
}
```

```json
// Expected response
{
	"outputs": [
		{
			"type": "classifier",
			"prediction": "admin",
			"confidence": 0.92,
			"probabilities": {
				"viewer": 0.05,
				"editor": 0.03,
				"admin": 0.92
			},
			"execution_time": 37
		}
	]
}
```

Runtime helpers:

- `mlForm.onSubmit(callback)` returns an unsubscribe function and delivers both the parsed inputs and the transformed backend response.
- `mlForm.lastInputs` and `mlForm.lastResponse` expose the latest submission synchronously.
- `DescriptorService` handles lazy loading and rendering of ML report components so predictions are shown without additional wiring.

## Extensibility

MLForm is built around strategy classes that map schema entries to UI components. You can add or replace strategies for bespoke controls or ML result renderers.

```typescript
import { MLForm } from "mlform";
import { FieldStrategy } from "mlform/extensions";

class ColorPickerStrategy extends FieldStrategy {
	constructor() {
		super("color", ColorSchema, () => import("./color-field"));
	}

	buildControl(field) {
		return {
			tag: "color-field",
			props: { value: field.value, label: field.title },
		};
	}
}

const mlForm = new MLForm("https://api.example.com/predict");
mlForm.register(new ColorPickerStrategy());
```

Use the default strategies exported from `mlform/strategies` as references when crafting new descriptors. Updates and removals follow the same pattern via `mlForm.update()` and `mlForm.unregister()`.

## Runtime utilities

- `mlForm.validateSchema(signature)` returns a Zod safe-parse result, useful for testing incoming schemas before rendering.
- `mlForm.schema()` produces a JSON Schema (draft 2020-12) for your current registry configuration, enabling schema introspection or documentation workflows.

## Tooling & scripts

The repository uses npm as the package manager and Vite for bundling.

- `npm run lint` – format-aware linting powered by Biome.
- `npm run type` – TypeScript project checks with `tsc --noEmit`.
- `npm run test` / `npm run coverage` – unit tests and coverage via Vitest and V8 instrumentation.
- `npm run build` – generates the production-ready `dist/` bundle and declaration files.
- `npm run ci` – convenience task combining lint, type checks, tests, and build.

CI/CD pipelines verify linting, type safety, tests across Node 18/20/22, build integrity, documentation, and dependency audits. Releases are published to both GitHub and npm through GitHub Actions.

## Documentation & resources

- Product documentation: https://ulloasp.github.io/mlform/
- Examples and guides: `docs/`
- Bundle visualizations: `stats/bundle_size_treemap.html`
- Issue tracker: https://github.com/UlloaSP/mlform/issues

## Contributing

We welcome issues, feature requests, and pull requests.

1. Fork the repository and create a feature branch.
2. Run `npm install` followed by `npm run lint`, `npm run type`, and `npm run test` before committing.
3. Add or update tests and documentation alongside code changes (target 80%+ coverage).
4. Use Conventional Commit messages when possible.
5. Open a pull request describing your change and expected impact.

## License

MLForm is released under the MIT License. See `LICENSE` for details.
