---
title: Installation
description: Install MLForm, choose an entry point, and know what the package needs at runtime.
---

```bash
npm install mlform
```

MLForm is an ES module package written in TypeScript. Its types ship with it. The built-in UI uses
[Lit](https://lit.dev/) Web Components and the schema contract uses [Zod](https://zod.dev/); both are
installed as dependencies. Install them in your application too when your own code imports them,
for example to write a [custom field](/extend/custom-fields/) or a Zod schema for a custom kind.

The library runs in browsers that support Web Components. Node.js consumers, such as tests or
tooling that imports the headless layers, need Node.js 20.19 or later.

## Choose an entry point

Most applications import the kit from the package root:

```ts
import { mountForm } from "mlform";
```

`mlform` and `mlform/kit` are the same module. Import a layer directly when you only need that
layer, for example headless state in a worker or a custom renderer:

```ts
import { createFormView } from "mlform/view";
import { createForm } from "mlform/runtime";
import { createBuiltinMlRegistry } from "mlform/builtins";
```

[Package exports](/reference/package-exports/) lists every surface and what it contains.
[Mental model](/getting-started/mental-model/) explains how the layers fit together.

## Fonts

MLForm does not download fonts. Themes name their font families and fall back to system fonts. The
`eshkra` theme used in these pages expects Mona Sans and JetBrains Mono; load them in your
application if you use it. See [Themes and recipes](/design/themes-and-recipes/).

## Working on MLForm itself

The repository uses Vite+ (`vp`) for installs, checks, tests, and builds.
Library and playground CI runs on Node.js 24; this documentation site requires Node.js 22.18 or
later.

```bash
vp install
vp check
vp run typecheck
vp test run
vp build
```

The documentation is a separate Astro Starlight project under `docs/`:

```bash
cd docs
vp install
vp run dev
vp run build
```
