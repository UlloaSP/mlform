---
title: createFormView
description: Full API guide for the app-facing headless kit controller.
---

## Signature

```ts
const view = createFormView(options);
```

`CreateFormViewOptions` is the same family of app-facing inputs used by `mountForm()`, plus headless `layout`.

## Input options

Required:

- `schema`
- `transport`

Common optional inputs:

- `layout`
- `registry`
- `primitiveRegistry`
- `designSystemRegistry`
- `initialValues`
- `validators`
- `hooks`
- `inactiveFieldPolicy`
- `listenerErrorPolicy`
- `onListenerError`

## Returned controller

```ts
interface FormViewController {
  form: FormController;
  engineRegistry: Registry;
  primitiveRegistry: PrimitiveRegistry;
  designSystemRegistry: DesignSystemRegistry;
  state: FormViewState;
  getSnapshot(): FormViewSnapshot;
  getNodeById(id: string): ResolvedFormLayoutNode | undefined;
  getField(id: string): FormViewFieldItem | undefined;
  getReport(id: string): FormViewReportItem | undefined;
  getVisibleFields(): FormViewFieldItem[];
  getVisibleReports(): FormViewReportItem[];
  getActiveLayoutNodes(): ResolvedFormLayoutNode[];
  validate(): Promise<FormValidationResult>;
  submit(options?: SubmitOptions): Promise<SubmitResult>;
  reset(): void;
  subscribe(listener): () => void;
  nextStep(): Promise<boolean>;
  prevStep(): void;
  goToStep(stepId: string): Promise<boolean>;
  setActiveTab(tabId: string): void;
  nextTab(): boolean;
  prevTab(): boolean;
  toggleSection(sectionId: string): void;
  openSection(sectionId: string): void;
  closeSection(sectionId: string): void;
  openAllSections(): void;
  closeAllSections(): void;
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
- `accordion`

`wizard` is `null` unless `layout.kind === "wizard"`.
`tabs` is `null` unless `layout.kind === "tabs"`.
`accordion` is `null` unless `layout.kind === "accordion"`.

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
- `visibleInLayout`

The report collection follows the same pattern.

## Navigation semantics

### `nextStep()`

- only meaningful for wizard layouts
- validates fields in the current step
- returns `false` on validation failure
- returns `true` when the current step is valid
- does not advance past the last step

### `prevStep()`

- only meaningful for wizard layouts
- never validates
- moves back one step when possible

### `goToStep(stepId)`

- allows free backward navigation
- validates incrementally when moving forward
- throws if used outside a wizard layout

### `setActiveTab(tabId)`

- only meaningful for tabs layouts
- switches tabs without validation
- throws if used outside a tabs layout

### `nextTab()` / `prevTab()`

- only meaningful for tabs layouts
- never validate
- return `false` when movement is not possible

### Accordion controls

- `toggleSection(sectionId)` opens or closes one accordion section
- `openSection(sectionId)` and `closeSection(sectionId)` are explicit variants
- `openAllSections()` and `closeAllSections()` manage the full accordion state
- all accordion control methods throw outside `layout.kind === "accordion"`

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
4. on teardown, unsubscribe and abort or unmount host-side resources

## Design system note

`createFormView()` does not attach stylesheets or mutate DOM. Use:

- `mountForm()` for built-in one-page DOM
- `mountWizardForm()` for built-in wizard DOM
- `mountTabsForm()` for built-in tabs DOM
- `mountAccordionForm()` for built-in accordion DOM
- `attachDesignSystem()` yourself when your custom host needs it
