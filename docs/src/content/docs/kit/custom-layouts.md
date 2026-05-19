---
title: Custom Layouts
description: Build your own wizard, tabs, accordion, or review UI on top of createFormView.
---

`createFormView()` is designed so you do not have to walk raw engine internals in app code.

## Basic rendering strategy

1. call `createFormView()`
2. read `snapshot.layout`
3. render nodes recursively
4. use `field.controller` and `report.controller`
5. re-render on `subscribe()`

## Recursive render model

Pseudo-code:

```ts
function renderNode(node, snapshot) {
  switch (node.kind) {
    case "section":
      return renderSection(
        node.title,
        node.children.map((child) => renderNode(child, snapshot)),
      );
    case "group":
      return renderGroup(
        node.columns,
        node.children.map((child) => renderNode(child, snapshot)),
      );
    case "field":
      return renderField(snapshot.fields.find((field) => field.id === node.field));
    case "report":
      return renderReport(snapshot.reports.find((report) => report.id === node.report));
  }
}
```

## Visibility

- `field.state.visible` comes from engine conditions
- `field.visibleInLayout` comes from the active layout step or active tab

Use both in wizard-like or tabbed UIs.

## Rendering options

### Reuse primitive elements

Fastest path:

- `mlf-field-frame`
- `mlf-report-frame`

This keeps MLForm’s built-in field and report rendering.

### Render your own host shell

Best when you need:

- custom navigation
- app-owned page chrome
- tabs or accordions
- layout integrated into an existing dashboard

## Common custom shells

- sidebar wizard
- top tabs
- mobile accordion
- review/summary page
- split analyst workspace

## When not to use createFormView

Use `mountForm()` or `mountWizardForm()` if:

- the built-in UI already matches your needs
- you do not want to own host rendering
- you want the lowest maintenance surface
