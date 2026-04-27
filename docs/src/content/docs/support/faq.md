---
title: FAQ
description: Short answers to common MLForm questions.
---

## Can I use MLForm without React?

Yes. MLForm mounts into a normal HTMLElement and renders Web Components.

## Can I use React, Vue, Angular, or Astro?

Yes. Mount in the framework lifecycle hook and call `mounted.unmount()` during cleanup.

## Can I run local models?

Yes. Pass a custom `transport` that calls the local model and returns `{ reports, meta }`.

## Can schemas come from a backend?

Yes, as long as they use serializable configuration. Function conditions cannot be sent as JSON.

## How do I customize appearance?

Use `designSystem` with built-in themes and recipes first. Use custom themes, custom recipes, or token overrides for deeper integration.

## Do API names get translated?

No. Keep `mountForm`, `fields`, `reports`, `kind`, and `label` exactly as the API expects.
