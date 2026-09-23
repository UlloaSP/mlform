---
title: createPrimitiveAdapter
description: Mount MLForm fields and reports in stable slots within an application-owned layout.
---

Use `createPrimitiveAdapter()` when your application builds the page but wants MLForm's built-in
field and report controls. Create the shell once and mount each control into an empty slot:

```ts
import { createFormView } from "mlform/view";
import { createPrimitiveAdapter } from "mlform/kit";

const view = createFormView({ schema, transport, plugins, layout });
const ui = createPrimitiveAdapter(view);

const shell = createMyLayout();
host.replaceChildren(shell.root);
ui.mountField(shell.speedSlot, "extrusionspeed");
ui.mountReport(shell.predictionSlot, "prediction");

// When the host is removed:
ui.dispose();
view.dispose();
```

The adapter subscribes to the view, updates descriptors and visibility, and keeps each frame in
the same slot while the view changes. It uses the view's report fetch mode. Optional
`primitiveRegistry`, `primitiveText`, and `reportTransport` options have the same roles as in
`mountForm()`. Attach a design system to the application's host separately if it needs MLForm
themes and tokens.

Each field or report id can be mounted once per adapter, and each slot can hold one mounted MLForm
control. Unknown ids and duplicate mounts throw. `dispose()` unsubscribes and removes only the
frames it created; it does not dispose the view or remove the application's shell. Keep the shell
mounted while editing to preserve focus and cursor position.

For a region with a fully custom interface, declare the fields it owns in the layout:

```ts
{ kind: "custom", id: "materials", fields: MATERIAL_FIELD_IDS }
```

The view validates those field references and applies navigation and disclosure visibility to
them. The application renders the region and manages its DOM. `mountForm()` cannot render a custom
region and fails during setup with an explanatory error.
