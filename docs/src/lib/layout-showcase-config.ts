import type { FormLayoutConfig, TabsLayoutConfig, WizardLayoutConfig } from "@/kit";
import type { FormSchema } from "@/schema";

export type ShowcaseLocale = "en" | "es";
export type Cleanup = () => void;

export type ShowcaseCopy = {
  customTitle: string;
  customBody: string;
  customSubmit: string;
  customNavLabel: string;
  customHint: string;
  statusIdle: string;
  statusValidating: string;
  statusSubmitting: string;
  open: string;
};

export const cleanupSymbol = Symbol("mlform.docs.layoutShowcase.cleanup");

export const copyByLocale: Record<ShowcaseLocale, ShowcaseCopy> = {
  en: {
    customTitle: "Custom headless shell",
    customBody: "Same tabs layout, host-owned sidebar and footer.",
    customSubmit: "Submit",
    customNavLabel: "Sections",
    customHint: "Built with createFormView() and primitive frames.",
    statusIdle: "Ready",
    statusValidating: "Validating...",
    statusSubmitting: "Submitting...",
    open: "Open",
  },
  es: {
    customTitle: "Shell headless personalizada",
    customBody: "Mismo layout de tabs, con sidebar y footer propios del host.",
    customSubmit: "Enviar",
    customNavLabel: "Secciones",
    customHint: "Construido con createFormView() y primitive frames.",
    statusIdle: "Listo",
    statusValidating: "Validando...",
    statusSubmitting: "Enviando...",
    open: "Abierta",
  },
};

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

export const schema: FormSchema = {
  fields: [
    {
      id: "name",
      kind: "text",
      label: "Applicant name",
      description: "Shown only to prove the same input can flow through every host.",
      required: true,
    },
    {
      id: "income",
      kind: "number",
      label: "Annual income",
      description: "Simple number field with the default primitive renderer.",
      required: true,
    },
    {
      id: "score",
      kind: "number",
      label: "Risk score",
      description: "Higher score means lower risk in the mock transport.",
      required: true,
    },
  ],
  reports: [
    {
      id: "risk",
      kind: "classifier",
      label: "Risk band",
      labels: ["High", "Medium", "Low"],
    },
  ],
};

export const wizardLayout: WizardLayoutConfig = {
  kind: "wizard",
  steps: [
    {
      id: "profile",
      title: "Profile",
      description: "Collect the person-level values first.",
      children: [
        { kind: "field", field: "name" },
        { kind: "field", field: "income" },
      ],
    },
    {
      id: "assessment",
      title: "Assessment",
      description: "Score and report live in the second step.",
      children: [
        { kind: "field", field: "score" },
        { kind: "report", report: "risk" },
      ],
    },
  ],
};

export const tabsLayout: TabsLayoutConfig = {
  kind: "tabs",
  tabs: [
    {
      id: "profile",
      title: "Profile",
      description: "Free switching between sections.",
      children: [
        { kind: "field", field: "name" },
        { kind: "field", field: "income" },
      ],
    },
    {
      id: "assessment",
      title: "Assessment",
      description: "The report stays in the same form engine.",
      children: [
        { kind: "field", field: "score" },
        { kind: "report", report: "risk" },
      ],
    },
  ],
};

export const disclosureLayout: FormLayoutConfig = {
  kind: "stacked",
  children: [
    {
      kind: "section",
      id: "profile",
      title: "Profile",
      description: "Default-open dense disclosure section.",
      children: [
        { kind: "field", field: "name" },
        { kind: "field", field: "income" },
      ],
    },
    {
      kind: "section",
      id: "assessment",
      title: "Assessment",
      defaultOpen: false,
      description: "Open this section to score and submit.",
      children: [
        { kind: "field", field: "score" },
        { kind: "report", report: "risk" },
      ],
    },
  ],
};

const normalizeProbabilities = (values: number[]): number[] => {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return [0.34, 0.33, 0.33];
  }

  return values.map((value) => Number((value / total).toFixed(3)));
};

export const createDemoTransport = () => ({
  async submit(request: { serializedValues: Record<string, unknown> }) {
    await delay(180);

    const income = Number(request.serializedValues.income ?? 0);
    const score = Number(request.serializedValues.score ?? 0);
    const stableScore = Number.isFinite(score) ? score : 0;
    const stableIncome = Number.isFinite(income) ? income : 0;

    const scoreFactor = Math.max(0, Math.min(stableScore / 100, 1));
    const incomeFactor = Math.max(0, Math.min(stableIncome / 120000, 1));
    const low = Math.max(0.1, Math.min(0.8, scoreFactor * 0.65 + incomeFactor * 0.2));
    const high = Math.max(0.05, Math.min(0.8, 0.85 - scoreFactor * 0.6 - incomeFactor * 0.25));
    const medium = Math.max(0.05, 1 - low - high);
    const normalized = normalizeProbabilities([high, medium, low]);
    const max = Math.max(...normalized);
    const prediction = ["high", "medium", "low"][normalized.indexOf(max)] ?? "medium";

    return {
      reports: {
        risk: {
          prediction,
          probabilities: normalized,
        },
      },
      meta: {
        source: "layout-showcase",
      },
    };
  },
});
