---
title: Vanilla DOM Headless Layout
description: Render a custom host shell without adopting a framework.
---

`createFormView()` is already enough for vanilla hosts.

Pattern:

1. create the view
2. call `getSnapshot()`
3. rebuild or patch host DOM
4. subscribe for updates

This is useful for:

- embedded widgets
- CMS integrations
- design experiments
- environments where frameworks are not available
