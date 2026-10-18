import { mountForm, type MountedForm } from "mlform/kit";
import type { FormSchema } from "mlform/schema";
import type { FormLayoutConfig, FormLayoutNode } from "mlform/view";
import type { DesignSystemConfig } from "mlform/design";
import "../../../brand/typography.css";

const schema: FormSchema = {
  fields: [
    { id: "text", kind: "text", label: "Text", required: true, minLength: 3, defaultValue: "Ready", description: "More information about this input." },
    { id: "number", kind: "number", label: "Number", min: 0, max: 10, step: 0.1, defaultValue: 5, unit: "mg/dL", ui: { input: "text" } },
    { id: "readonly", kind: "number", label: "Read only", defaultValue: 5, readOnly: true, unit: "mg/dL" },
    { id: "disabled", kind: "number", label: "Disabled", defaultValue: 5, disabled: true, unit: "mg/dL" },
    { id: "date", kind: "date", label: "Date", min: "2026-01-01", max: "2026-12-31", defaultValue: "2026-06-01" },
    { id: "category", kind: "category", label: "Category", options: ["one", "two"], defaultValue: "legacy" },
    { id: "boolean", kind: "boolean", label: "Boolean", defaultValue: false },
    { id: "readonly-range", kind: "number", label: "Read only slider", min: 0, max: 10, defaultValue: 5, readOnly: true },
    { id: "disabled-range", kind: "number", label: "Disabled slider", min: 0, max: 10, defaultValue: 5, disabled: true },
    { id: "long-unit", kind: "number", label: "Long unit", defaultValue: 12, unit: "milligrams per deciliter of measured sample" },
    { id: "hidden", kind: "number", label: "Conditional", defaultValue: 42, hiddenWhen: { kind: "field-value", field: "boolean", equals: false } },
    ...["editable", "readonly", "disabled"].map((mode) => ({
      id: `series-${mode}`, kind: "series", label: `Series ${mode}`, minPoints: 1,
      readOnly: mode === "readonly", disabled: mode === "disabled",
      showAggregationSummary: false,
      columns: [
        { id: "number", kind: "number", label: "Reading", min: 0, max: 10, unit: "mg/dL" },
        { id: "category", kind: "category", label: "Channel", options: ["one", "two"] },
        { id: "date", kind: "date", label: "Observed", min: "2026-01-01", max: "2026-12-31" },
      ],
      defaultValue: [{ number: 5, category: mode === "editable" ? "legacy" : "one", date: "2026-06-01" }],
    })),
  ],
};

export type MatrixLayout = "stacked" | "split" | "accordion" | "tabs" | "wizard";
const children: FormLayoutNode[] = schema.fields.map((field) => ({ kind: "field", field: field.id! }));
const layoutFor = (kind: MatrixLayout): FormLayoutConfig => {
  if (kind === "tabs") return { kind, tabs: [{ id: "inputs", title: "Inputs", children }] };
  if (kind === "wizard") return { kind, steps: [{ id: "inputs", title: "Inputs", children }] };
  if (kind === "accordion") return { kind: "stacked", children: [{ kind: "section", id: "inputs", title: "Inputs", defaultOpen: true, children }] };
  return { kind, children };
};

let mounted: MountedForm | undefined;
const fieldMatrix = {
  mount(layout: MatrixLayout, designSystem: DesignSystemConfig) {
    mounted?.unmount();
    mounted = mountForm(document.getElementById("root")!, {
      schema, layout: layoutFor(layout), designSystem,
      transport: { submit: async () => ({ reports: [] }) },
    });
  },
  setValues(values: Record<string, unknown>) { mounted!.form.setValues(values); },
};

declare global { interface Window { fieldMatrix: typeof fieldMatrix } }
window.fieldMatrix = fieldMatrix;
