---
title: View Reference
description: Compose a form for application-owned rendering without mounting DOM.
---

`mlform/view` exports `createFormView`, `defineFieldKind`, `defineReportKind`,
`defineMLFormPlugin`, `createBuiltinDescriptorRegistry`, and the layout helpers
`walkLayoutNodes`, `flattenLayoutNodes`, and `collectLayoutReferences`.

Its types include `CreateFormViewOptions`, `FormViewController`, `FormViewSnapshot`,
`FormLayoutConfig`, resolved layout nodes, navigation state, and declarative field and report
definitions. The view owns schema-to-presenter registration, resolved layout, navigation,
visibility, and submit orchestration. It creates no DOM. `mlform/primitives` supplies the
individual Web Component renderers consumed by the mounted kit.

Start with [createFormView](../../view/create-form-view/) when your application renders its own
form, or [layout schema](../../view/layout-schema/) to define the arrangement shared with kit.
