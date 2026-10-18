import type { FormLayoutConfig } from "mlform/view";
import type { FormSchema } from "mlform/schema";
import type { DesignSystemConfig } from "mlform/design";
import { mountForm } from "mlform/kit";
import { BACKEND_COMPARE_PLUGIN, createAppPrimitiveRegistry } from "./report-definition.ts";
import { PLAYGROUND_DESIGN_SYSTEM, PLAYGROUND_LABELS, PRIMITIVE_TEXT } from "./config.ts";
import { FORM_SCHEMA } from "./schema.ts";
import { PLAYGROUND_SECTIONED_LAYOUT } from "./section-layouts.ts";
import { PLAYGROUND_TABS_LAYOUTS } from "./tabs-layouts.ts";
import { createAggregateTransport } from "./transport.ts";
import { PLAYGROUND_WIZARD_LAYOUTS } from "./wizard-layouts.ts";

const normalizeSinglePageLayout = (
  layout: "sectioned" | "stacked" | "split" | FormLayoutConfig,
): FormLayoutConfig =>
  layout === "sectioned"
    ? PLAYGROUND_SECTIONED_LAYOUT
    : typeof layout === "string"
      ? { kind: layout }
      : layout;

export const mountPlayground = (
  container: HTMLElement = document.body,
  layout: "sectioned" | "stacked" | "split" | FormLayoutConfig = "stacked",
  schema: FormSchema = FORM_SCHEMA,
  designSystem: DesignSystemConfig = PLAYGROUND_DESIGN_SYSTEM,
) => {
  return mountForm(container, {
    schema,
    transport: createAggregateTransport(),
    plugins: [BACKEND_COMPARE_PLUGIN],
    primitiveRegistry: createAppPrimitiveRegistry(),
    layout: normalizeSinglePageLayout(layout),
    containerStrategy: "replace",
    reportPane: "always",
    reportFetchMode: "all",
    designSystem,
    labels: PLAYGROUND_LABELS,
    primitiveText: PRIMITIVE_TEXT,
  });
};

export const mountWizardPlayground = (
  container: HTMLElement = document.body,
  designSystem: DesignSystemConfig = PLAYGROUND_DESIGN_SYSTEM,
) => {
  return mountForm(container, {
    schema: FORM_SCHEMA,
    transport: createAggregateTransport(),
    plugins: [BACKEND_COMPARE_PLUGIN],
    primitiveRegistry: createAppPrimitiveRegistry(),
    layout: PLAYGROUND_WIZARD_LAYOUTS.reports,
    designSystem,
    reportFetchMode: "all",
    labels: {
      prev: "Back",
      next: "Continue",
      submit: PLAYGROUND_LABELS.submit,
      validating: "Validating…",
      submitting: "Running backend comparison…",
    },
    primitiveText: PRIMITIVE_TEXT,
  });
};

export const mountTabsPlayground = (
  container: HTMLElement = document.body,
  designSystem: DesignSystemConfig = PLAYGROUND_DESIGN_SYSTEM,
) => {
  return mountForm(container, {
    schema: FORM_SCHEMA,
    transport: createAggregateTransport(),
    plugins: [BACKEND_COMPARE_PLUGIN],
    primitiveRegistry: createAppPrimitiveRegistry(),
    layout: PLAYGROUND_TABS_LAYOUTS.classic,
    designSystem,
    reportFetchMode: "all",
    labels: {
      ...PLAYGROUND_LABELS,
      validating: "Validating…",
      submitting: "Running backend comparison…",
    },
    primitiveText: PRIMITIVE_TEXT,
  });
};
