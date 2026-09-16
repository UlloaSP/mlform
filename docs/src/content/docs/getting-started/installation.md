---
title: Installation
description: Install MLForm and prepare the documentation workspace.
---

Install the runtime package in an application:

```bash
npm install mlform
```

If you want the exact release documented here, install `0.1.24` explicitly:

```bash
npm install mlform@0.1.24
```

Import from the kit for normal application use:

```ts
import { mountForm } from "mlform";
```

Use subpath imports only when you need a specific layer:

```ts
import { createForm } from "mlform/runtime";
import { createPrimitiveRegistry } from "mlform/primitives";
import { defineTheme } from "mlform/design";
```

For this repository, use Vite+:

```bash
vp install
vp check
vp test
vp build
```

The package supports Node.js `>=20.19.0` for Node-based consumers and tooling. The docs workspace is an Astro Starlight app under `docs/` and uses the same `vp` workflow:

```bash
cd docs
vp install
vp run typecheck
vp run build
vp run dev
```

Common mistakes:

| Mistake                                              | Fix                          |
| ---------------------------------------------------- | ---------------------------- |
| Installing the docs dependencies with `npm` directly | Use `vp install`.            |
| Importing test utilities from `vitest`               | Use this repo's Vite+ setup. |
| Using legacy examples with a class constructor       | Use `mountForm`.             |
