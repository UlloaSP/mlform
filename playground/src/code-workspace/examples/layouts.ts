import type { FormSchema } from "mlform/schema";
import type { FormLayoutConfig, FormLayoutNode } from "mlform/view";

const schema: FormSchema = {
  fields: [
    {
      id: "name",
      kind: "text",
      label: "Project name",
      mappedTo: "name",
      defaultValue: "Weekend study",
      required: true,
      minLength: 3,
    },
    {
      id: "notes",
      kind: "long-text",
      label: "Notes",
      mappedTo: "notes",
      defaultValue: "Compare the available layouts.",
      rows: 3,
    },
    {
      id: "hours",
      kind: "number",
      label: "Hours per week",
      mappedTo: "hours",
      defaultValue: 5,
      min: 0,
      max: 40,
      unit: "h",
      required: true,
    },
    {
      id: "start",
      kind: "date",
      label: "Start date",
      mappedTo: "start",
      defaultValue: "2026-06-15",
    },
    {
      id: "approved",
      kind: "boolean",
      label: "Approved",
      mappedTo: "approved",
      defaultValue: true,
      required: true,
    },
    {
      id: "rating",
      kind: "rating",
      label: "Priority",
      mappedTo: "rating",
      max: 5,
      defaultValue: 3,
    },
  ],
  reports: [
    { id: "total", kind: "regressor", label: "Hours in four weeks", mappedTo: "total", unit: "h" },
    {
      id: "decision",
      kind: "classifier",
      label: "Review decision",
      mappedTo: "decision",
      labels: ["Review", "Ready"],
      showClassProbabilities: true,
    },
  ],
};
const field = (id: string): FormLayoutNode => ({ kind: "field", field: id });
const sections: FormLayoutNode[] = [
  {
    kind: "section",
    id: "project",
    title: "Project",
    defaultOpen: true,
    children: [field("name"), field("notes")],
  },
  {
    kind: "section",
    id: "schedule",
    title: "Schedule",
    defaultOpen: true,
    children: [
      {
        kind: "group",
        columns: 2,
        children: [field("hours"), field("start"), field("approved"), field("rating")],
      },
    ],
  },
  {
    kind: "section",
    id: "results",
    title: "Results",
    defaultOpen: true,
    children: [
      {
        kind: "group",
        columns: 2,
        children: [
          { kind: "report", report: "total" },
          { kind: "report", report: "decision" },
        ],
      },
    ],
  },
];
const layouts: { id: string; label: string; layout: FormLayoutConfig }[] = [
  {
    id: "groups",
    label: "Groups · six field types",
    layout: { kind: "stacked", children: sections },
  },
  { id: "split", label: "Split · fields and reports", layout: { kind: "split" } },
  {
    id: "tabs",
    label: "Tabs · grouped content",
    layout: {
      kind: "tabs",
      tabs: [
        { id: "project", title: "Project", children: [sections[0]] },
        { id: "schedule", title: "Schedule", children: [sections[1]] },
        { id: "results", title: "Results", children: [sections[2]] },
      ],
    },
  },
  {
    id: "wizard",
    label: "Wizard · inputs to results",
    layout: {
      kind: "wizard",
      steps: [
        { id: "project", title: "Project", children: [sections[0]] },
        { id: "schedule", title: "Schedule", children: [sections[1]] },
        { id: "results", title: "Results", children: [sections[2]] },
      ],
    },
  },
];

export const LAYOUT_EXAMPLES = layouts.map(({ id, label, layout }) => ({
  id,
  label,
  code: `import { mountForm } from "mlform";

const schema = ${JSON.stringify(schema, null, 2)};

const container = document.querySelector<HTMLElement>("#form")!;
${layout.kind === "stacked" ? "" : 'container.style.height = "calc(100dvh - 2rem)";\n'}
mountForm(container, {
  schema,
  layout: ${JSON.stringify(layout, null, 2).replaceAll("\n", "\n  ")},
  transport: {
    async submit({ modelValues }) {
      const ready = Boolean(modelValues.approved);
      return { reports: [
        { backend: "default", mappedTo: "total", status: "ready",
          payload: { value: Number(modelValues.hours) * 4 } },
        { backend: "default", mappedTo: "decision", status: "ready",
          payload: { prediction: ready ? "1" : "0", probabilities: ready ? [0.1, 0.9] : [0.8, 0.2] } },
      ] };
    },
  },
});
`,
}));
