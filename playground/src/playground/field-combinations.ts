import type { DesignSystemConfig } from "mlform/design";
import type { FormLayoutConfig } from "mlform/view";
import { mountForm } from "mlform/kit";
import { FIELD_COMBINATIONS_SCHEMA, FIELD_CASE_VALUES } from "./field-combinations-schema.ts";
import "./field-combinations.css";

const layout: FormLayoutConfig = {
  kind: "stacked",
  children: [
    "text",
    "long-text",
    "number",
    "boolean",
    "category",
    "single-choice",
    "multi-choice",
    "mapped-category",
    "onehot-category",
    "rating",
    "date",
    "series",
  ].map((kind) => ({
    kind: "section",
    id: `${kind}-examples`,
    title:
      kind === "series"
        ? "Series · 1–4 columns"
        : kind[0].toUpperCase() + kind.slice(1).replaceAll("-", " "),
    description:
      kind === "series"
        ? "Single and mixed columns, row limits, cell errors and aggregates, both visible and hidden."
        : undefined,
    defaultOpen: true,
    children: [
      {
        kind: "group",
        columns: kind === "series" ? 1 : 2,
        children: FIELD_COMBINATIONS_SCHEMA.fields
          .filter((field) => field.kind === kind)
          .map((field) => ({ kind: "field", field: field.id! })),
      },
    ],
  })),
};

export const mountFieldCombinationsPlayground = (
  container: HTMLElement,
  initialDesign: DesignSystemConfig,
) => {
  const page = document.createElement("div");
  page.className = "field-combos";
  page.innerHTML = `
    <h1>Field combos</h1>
    <p class="field-combos-intro">Each field has its own value: valid, empty, invalid, disabled and read-only. Errors are shown on load. Use “Show conditional fields” in Boolean to reveal the hidden cases.</p>
    <div data-role="field-combos-form"></div>
  `;
  container.replaceChildren(page);
  const mounted = mountForm(page.querySelector<HTMLElement>('[data-role="field-combos-form"]')!, {
    schema: FIELD_COMBINATIONS_SCHEMA,
    layout,
    designSystem: initialDesign,
    reportPane: "hidden",
    labels: { submit: "Validate fields" },
    primitiveText: { seriesAddRow: "Add observation", seriesRemoveRow: "Remove observation" },
    transport: {
      async submit() {
        return { reports: [] };
      },
    },
  });
  mounted.form.setValues(FIELD_CASE_VALUES);
  // This catalogue deliberately reveals validation feedback before any interaction.
  for (const field of mounted.form.fields) field.blur();
  return {
    form: mounted.form,
    updateDesignSystem(config: DesignSystemConfig) {
      mounted.updateDesignSystem(config);
    },
    unmount() {
      mounted.unmount();
      page.remove();
    },
  };
};
