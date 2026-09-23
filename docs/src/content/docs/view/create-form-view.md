---
title: createFormView
description: Compose schema, state, descriptors, and layout without mounting DOM.
---

## Signature

```ts
const view = createFormView(options);
```

Import `createFormView` from `mlform/view`. It composes runtime state, layout, navigation, and
presenter descriptors without mounting DOM. Primitive renderer and design system options stay on
`mountForm()`.

## Input options

Required:

- `schema`
- `transport`

Common optional inputs:

- `layout`
- `plugins`
- `registry`
- `initialValues`
- `validators`
- `hooks`
- `inactiveFieldPolicy`
- `listenerErrorPolicy`
- `onListenerError`

Use `plugins` for custom field and report kinds. A plugin carries its schema definition, presenter, and optional runtime behaviors through one interface; direct registry options remain available for low-level integrations.

## Returned controller

```ts
interface FormViewController {
  form: FormController;
  engineRegistry: Registry;
  descriptorRegistry: PrimitiveDescriptorRegistry;
  navigation: FormViewNavigationController;
  state: FormViewState;
  getSnapshot(): FormViewSnapshot;
  getNodeById(id: string): ResolvedFormLayoutNode | undefined;
  getField(id: string): FormViewFieldItem | undefined;
  getReport(id: string): FormViewReportItem | undefined;
  getVisibleFields(): FormViewFieldItem[];
  getVisibleReports(): FormViewReportItem[];
  validate(): Promise<FormValidationResult>;
  submit(options?: SubmitOptions): Promise<SubmitResult>;
  submitPipeline(options?: SubmitOptions): Promise<PipelineResult>;
  reset(): void;
  dispose(): void;
  subscribe(listener): () => void;
}
```

## Snapshot shape

`getSnapshot()` returns:

- `form`
- `layout`
- `fields`
- `reports`
- `wizard`
- `tabs`
- `disclosure`

`wizard` is `null` unless `layout.kind === "wizard"`.
`tabs` is `null` unless `layout.kind === "tabs"`.
`disclosure` is `null` when the active layout contains no disclosure sections.

## Item collections

Each field item contains:

- `id`
- `kind`
- `config`
- `controller`
- `state`
- `descriptor`
- `stepId`
- `tabId`
- `sectionId` (the innermost section, if any)
- `sectionIds` (all enclosing sections, outermost first)
- `visibleInLayout`

The report collection follows the same pattern.

## Navigation semantics

### `navigation.next()`

- in a wizard, validates the current step before advancing
- in tabs, advances without validation
- returns `false` when validation fails or movement is not available
- a valid final wizard step returns `true` without moving past the end

### `navigation.previous()`

- never validates
- moves back one wizard step or tab
- returns whether navigation changed

### `navigation.activate(id)`

- activates a tab directly
- allows free backward wizard navigation
- validates wizard steps incrementally when moving forward
- returns `false` for stacked and split layouts
- throws when the current wizard or tabs layout does not contain `id`

### `navigation.getActiveNodes()`

- returns the currently active layout nodes after wizard, tab, and disclosure state is applied

### Disclosure controls

- `navigation.disclosure.toggle(sectionId)` opens or closes one section
- `open(sectionId)` and `close(sectionId)` are explicit variants
- `openAll()` and `closeAll()` manage every section in the layout
- section controls work inside stacked, split, wizard, and tabs layouts
- an unknown section id throws

## Subscription model

Use `subscribe()` for host rendering:

```ts
const unsubscribe = view.subscribe((snapshot) => {
  render(snapshot);
});
```

Typical host pattern:

1. create the view once
2. render initial snapshot
3. subscribe
4. on teardown, unsubscribe and call `view.dispose()`

## Design system note

`createFormView()` does not resolve primitive renderers, attach stylesheets, or mutate DOM. Use:

- `mountForm()` for built-in one-page DOM
- `mountForm()` for built-in wizard DOM
- `mountForm()` for built-in tabs DOM
- `mountForm()` for built-in disclosure DOM
- `attachDesignSystem()` yourself when your custom host needs it
