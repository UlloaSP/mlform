---
title: Installation
description: Install MLForm and prepare the documentation workspace.
---

Install the runtime package in an application:

```bash
npm install mlform
```

To pin the installed release instead of accepting a version range:

```bash
npm install --save-exact mlform
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

The package supports Node.js `>=20.19.0` for Node-based consumers. The docs workspace requires
Node.js `>=22.18.0`; repository CI uses Node.js 24 for library and playground checks and Node.js
22.18 for docs. The Astro Starlight app under `docs/` uses the same `vp` workflow:

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
