---
title: Kit Reference
description: Mount and manage the integrated MLForm interface.
---

`mlform` and `mlform/kit` resolve to the same package entry. They export `mountForm`, `unmountForm`,
`defaultKitDesignSystem`, and `defaultKitLabels`, along with `MountFormOptions`, `MountedForm`,
`KitLabels`, and `KitDesignSystemSnapshot` types.

`mountForm(container, options)` requires a schema and transport. It creates a view, renders the
selected layout with built-in Web Components, attaches the design system, and returns a handle
with the runtime form and `unmount()`.

The container must be empty unless `containerStrategy: "replace"` is set. Replacement restores
the prior content on unmount for every layout. Reusing a container unmounts the previous MLForm
instance after the new host and design system are ready. A setup failure leaves the previous instance mounted.

Kit forwards runtime options such as `inactiveFieldPolicy`, hooks, and listener error policy to
the view. `reportFetchMode`, `reportTransport`, and user-facing labels also apply to explicit
sections, tabs, and wizard layouts. See the [view reference](../view/) for custom rendering,
layouts, and extension definitions.

`reportPane: "hidden"` hides report nodes in explicit layouts. A parent window may mount into a
same-origin iframe after MLForm's components are registered in the iframe document.
