---
title: FAQ
description: Short answers to common questions about MLForm.
---

## Do I need React or another framework?

No. MLForm mounts Web Components into any element. [Frameworks](/integrations/frameworks/) shows the
lifecycle wiring for React, Vue, Angular, and Astro.

## Can I use my own components instead of MLForm's?

Yes, at three depths: replace individual kinds with [custom fields](/extend/custom-fields/) and
[reports](/extend/custom-reports/), place MLForm's controls in your own layout with
[`createPrimitiveAdapter`](/kit/primitive-adapter/), or render everything from the
[headless view](/view/overview/).

## Can the model run in the browser?

Yes. A transport is any async function; call a local model, worker, or WASM module and return
envelopes. See [Transports](/guides/transports/#local-and-in-browser-models).

## Can the schema come from my backend?

Yes, when it uses declarative conditions; function conditions cannot be serialized. Validate it
with `validateSchema` before mounting. See [Schemas from a backend](/schema/overview/#schemas-from-a-backend).

## Does MLForm send HTTP requests, retry, or cache?

No. Your transport owns the protocol. MLForm owns validation, the request it hands to the
transport, and how results reach reports.

## Can one form feed several models?

Yes, with per-backend `mappedTo` maps. See [Multiple backends](/guides/multiple-backends/).

## Can I translate the interface?

Labels, control text, and schema copy can be translated. The validation messages of built-in kinds
are English in this version. See [Localization](/kit/labels/#localization).

## How do I match my brand?

Pick a theme and recipe, override tokens, or define your own theme. Start with
[Themes and recipes](/design/themes-and-recipes/).
