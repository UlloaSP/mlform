import type { FormSchema } from "mlform/schema";
import type { Transport } from "mlform/transport";
import type { FormLayoutConfig } from "mlform/view";

export type Cleanup = () => void;

export const schema: FormSchema = {
  fields: [
    {
      id: "name",
      kind: "text",
      label: "Applicant name",
      description: "The same input flows through every host on this page.",
      mappedTo: "name",
      required: true,
    },
    { id: "income", kind: "number", label: "Annual income", unit: "€", min: 0, mappedTo: "income", required: true },
    {
      id: "score",
      kind: "number",
      label: "Risk score",
      description: "Higher scores mean lower risk in this demo transport.",
      min: 0,
      max: 100,
      mappedTo: "score",
      required: true,
    },
  ],
  reports: [
    { id: "risk", kind: "classifier", label: "Risk band", labels: ["High", "Medium", "Low"], mappedTo: "risk" },
  ],
};

const profile = [
  { kind: "field", field: "name" },
  { kind: "field", field: "income" },
] as const;
const assessment = [
  { kind: "field", field: "score" },
  { kind: "report", report: "risk" },
] as const;

export const layouts = {
  stacked: undefined,
  split: { kind: "split" },
  wizard: {
    kind: "wizard",
    steps: [
      { id: "profile", title: "Profile", children: [...profile] },
      { id: "assessment", title: "Assessment", children: [...assessment] },
    ],
  },
  tabs: {
    kind: "tabs",
    tabs: [
      { id: "profile", title: "Profile", children: [...profile] },
      { id: "assessment", title: "Assessment", children: [...assessment] },
    ],
  },
  sections: {
    kind: "stacked",
    children: [
      { kind: "section", id: "profile", title: "Profile", children: [...profile] },
      {
        kind: "section",
        id: "assessment",
        title: "Assessment",
        defaultOpen: false,
        children: [...assessment],
      },
    ],
  },
} satisfies Record<string, FormLayoutConfig | undefined>;

// A deterministic stand-in for a model. The short wait makes the loading state visible.
export const createDemoTransport = (): Transport => ({
  async submit(request) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const score = Math.min(Math.max(Number(request.modelValues.score) / 100, 0), 1);
    const income = Math.min(Math.max(Number(request.modelValues.income) / 120000, 0), 1);
    const low = 0.1 + 0.6 * score * (0.7 + 0.3 * income);
    const high = 0.1 + 0.6 * (1 - score);
    const total = low + high + 0.2;
    const probabilities = [high / total, 0.2 / total, low / total];
    const prediction = ["High", "Medium", "Low"][probabilities.indexOf(Math.max(...probabilities))];
    return {
      reports: [
        { backend: "default", mappedTo: "risk", status: "ready", payload: { prediction, probabilities } },
      ],
    };
  },
});
