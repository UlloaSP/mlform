---
title: Primitives Overview
description: Renderer primitives that connect engine descriptors to Web Components.
---

Primitives are the DOM layer below the kit. They read engine descriptors and mount Web Components for fields, reports, form layout, errors, and submit controls.

Use primitives directly when:

- you use the MLForm engine but want your own kit wrapper
- you need to register custom Web Component renderers
- you want to embed MLForm in a host that manages its own design system attachment

Most applications should use `mountForm` from the root package.

`mountForm` expects an empty container by default. Pass `containerStrategy: "replace"` only when you explicitly want to replace existing host content and restore it on `unmount()`.
