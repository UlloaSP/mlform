import {
  createFormView,
  mountAccordionForm,
  mountForm,
  mountTabsForm,
  mountWizardForm,
} from "../../../dist/mlform.mjs";
import { attachDesignSystem } from "../../../dist/mlform/design-system.mjs";

type ShowcaseLocale = "en" | "es";
type Cleanup = () => void;
type FormViewController = ReturnType<typeof createFormView>;
type FormViewSnapshot = ReturnType<FormViewController["getSnapshot"]>;
type ResolvedFormLayoutNode = {
  kind: "section" | "group" | "field" | "report" | "explanation";
  id?: string;
  title?: string;
  description?: string;
  columns?: number;
  children?: ResolvedFormLayoutNode[];
  field?: string;
  report?: string;
  explanation?: string;
};

type ShowcaseCopy = {
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

const cleanupSymbol = Symbol("mlform.docs.layoutShowcase.cleanup");

type ShowcaseRoot = HTMLElement & {
  [cleanupSymbol]?: Cleanup;
};

const copyByLocale: Record<ShowcaseLocale, ShowcaseCopy> = {
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

const schema = {
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
} as const;

const wizardLayout = {
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
} as const;

const tabsLayout = {
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
} as const;

const accordionLayout = {
  kind: "accordion",
  sections: [
    {
      id: "profile",
      title: "Profile",
      description: "Default-open dense disclosure section.",
      children: [
        { kind: "field", field: "name" },
        { kind: "field", field: "income" },
      ],
    },
    {
      id: "assessment",
      title: "Assessment",
      description: "Open this section to score and submit.",
      children: [
        { kind: "field", field: "score" },
        { kind: "report", report: "risk" },
      ],
    },
  ],
} as const;

const normalizeProbabilities = (values: number[]): number[] => {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return [0.34, 0.33, 0.33];
  }

  return values.map((value) => Number((value / total).toFixed(3)));
};

const createDemoTransport = () => ({
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

const createFrame = (
  tagName: "mlf-field-frame" | "mlf-report-frame",
  snapshot: FormViewSnapshot,
  view: FormViewController,
  id: string,
): HTMLElement | null => {
  if (tagName === "mlf-field-frame") {
    const field = snapshot.fields.find((entry: { id: string }) => entry.id === id);
    if (!field) {
      return null;
    }

    const element = document.createElement(tagName) as HTMLElement & {
      controller?: unknown;
      registry?: unknown;
    };
    element.controller = field.controller;
    element.registry = view.primitiveRegistry;
    return element;
  }

  const report = snapshot.reports.find((entry: { id: string }) => entry.id === id);
  if (!report) {
    return null;
  }

  const element = document.createElement(tagName) as HTMLElement & {
    controller?: unknown;
    registry?: unknown;
    lastResult?: unknown;
  };
  element.controller = report.controller;
  element.registry = view.primitiveRegistry;
  element.lastResult = snapshot.form.lastResult;
  return element;
};

const renderCustomNode = (
  node: ResolvedFormLayoutNode,
  snapshot: FormViewSnapshot,
  view: FormViewController,
): HTMLElement | null => {
  switch (node.kind) {
    case "section": {
      const section = document.createElement("section");
      section.className = "layout-showcase-custom-section";

      if (node.title || node.description) {
        const copy = document.createElement("div");
        copy.className = "layout-showcase-custom-copy";
        if (node.title) {
          const title = document.createElement("h4");
          title.textContent = node.title;
          copy.append(title);
        }
        if (node.description) {
          const description = document.createElement("p");
          description.textContent = node.description;
          copy.append(description);
        }
        section.append(copy);
      }

      const children = document.createElement("div");
      children.className = "layout-showcase-custom-children";
      for (const child of node.children ?? []) {
        const childElement = renderCustomNode(child, snapshot, view);
        if (childElement) {
          children.append(childElement);
        }
      }
      section.append(children);
      return section;
    }
    case "group": {
      const group = document.createElement("div");
      group.className = "layout-showcase-custom-children";
      for (const child of node.children ?? []) {
        const childElement = renderCustomNode(child, snapshot, view);
        if (childElement) {
          group.append(childElement);
        }
      }
      return group;
    }
    case "field":
      if (!node.field) {
        return null;
      }
      return createFrame("mlf-field-frame", snapshot, view, node.field);
    case "report":
      if (!node.report) {
        return null;
      }
      return createFrame("mlf-report-frame", snapshot, view, node.report);
    case "explanation":
      return null;
  }
};

const mountCustomHeadless = (host: HTMLElement, locale: ShowcaseLocale): Cleanup => {
  const copy = copyByLocale[locale];
  const view = createFormView({
    schema,
    transport: createDemoTransport(),
    layout: tabsLayout,
  });
  const designSystem = attachDesignSystem(host, {
    registry: view.designSystemRegistry,
  });

  const render = (): void => {
    const snapshot = view.getSnapshot();
    if (snapshot.layout.kind !== "tabs" || !snapshot.tabs) {
      return;
    }

    host.replaceChildren();

    const shell = document.createElement("section");
    shell.className = "layout-showcase-custom-shell";

    const nav = document.createElement("aside");
    nav.className = "layout-showcase-custom-nav";

    const navTitle = document.createElement("p");
    navTitle.className = "layout-showcase-custom-nav-label";
    navTitle.textContent = copy.customNavLabel;
    nav.append(navTitle);

    for (const [index, tab] of snapshot.layout.tabs.entries()) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "layout-showcase-custom-tab";
      button.dataset.active = String(index === snapshot.tabs.activeTabIndex);
      button.textContent = tab.title;
      button.addEventListener("click", () => {
        view.setActiveTab(tab.id);
      });
      nav.append(button);
    }

    const main = document.createElement("div");
    main.className = "layout-showcase-custom-main";

    const header = document.createElement("header");
    header.className = "layout-showcase-custom-header";
    const title = document.createElement("h4");
    title.textContent = copy.customTitle;
    const body = document.createElement("p");
    body.textContent = copy.customBody;
    header.append(title, body);
    main.append(header);

    const panelBody = document.createElement("div");
    panelBody.className = "layout-showcase-custom-panel";
    for (const node of view.getActiveLayoutNodes()) {
      const nodeElement = renderCustomNode(node, snapshot, view);
      if (nodeElement) {
        panelBody.append(nodeElement);
      }
    }
    main.append(panelBody);

    const footer = document.createElement("footer");
    footer.className = "layout-showcase-custom-footer";
    const hint = document.createElement("span");
    const currentTab = snapshot.layout.tabs[snapshot.tabs.activeTabIndex];
    hint.textContent = `${copy.open}: ${currentTab?.title ?? ""}. ${copy.customHint}`;

    const submit = document.createElement("button");
    submit.type = "button";
    submit.className = "layout-showcase-custom-submit";
    submit.disabled =
      snapshot.form.status === "validating" || snapshot.form.status === "submitting";
    submit.textContent =
      snapshot.form.status === "validating"
        ? copy.statusValidating
        : snapshot.form.status === "submitting"
          ? copy.statusSubmitting
          : copy.customSubmit;
    submit.addEventListener("click", () => {
      void view.submit();
    });

    footer.append(hint, submit);
    main.append(footer);

    const status = document.createElement("div");
    status.className = "layout-showcase-custom-status";
    status.textContent =
      snapshot.form.status === "validating"
        ? copy.statusValidating
        : snapshot.form.status === "submitting"
          ? copy.statusSubmitting
          : copy.statusIdle;
    main.append(status);

    shell.append(nav, main);
    host.append(shell);
  };

  render();
  const unsubscribe = view.subscribe(() => {
    render();
  });

  return () => {
    unsubscribe();
    view.form.abortSubmit("layout-showcase");
    designSystem.disconnect();
    host.replaceChildren();
  };
};

const resolveHost = (root: HTMLElement, id: string): HTMLElement | null =>
  root.querySelector<HTMLElement>(`[data-layout-showcase-host="${id}"]`);

export const mountLayoutShowcase = (root: HTMLElement, locale: ShowcaseLocale = "en"): Cleanup => {
  const showcaseRoot = root as ShowcaseRoot;
  showcaseRoot[cleanupSymbol]?.();

  const cleanups: Cleanup[] = [];

  const onePageHost = resolveHost(root, "one-page");
  if (onePageHost) {
    const mounted = mountForm(onePageHost, {
      schema,
      transport: createDemoTransport(),
    });
    cleanups.push(() => mounted.unmount());
  }

  const wizardHost = resolveHost(root, "wizard");
  if (wizardHost) {
    const mounted = mountWizardForm(wizardHost, {
      schema,
      transport: createDemoTransport(),
      layout: wizardLayout,
    });
    cleanups.push(() => mounted.unmount());
  }

  const tabsHost = resolveHost(root, "tabs");
  if (tabsHost) {
    const mounted = mountTabsForm(tabsHost, {
      schema,
      transport: createDemoTransport(),
      layout: tabsLayout,
    });
    cleanups.push(() => mounted.unmount());
  }

  const accordionHost = resolveHost(root, "accordion");
  if (accordionHost) {
    const mounted = mountAccordionForm(accordionHost, {
      schema,
      transport: createDemoTransport(),
      layout: accordionLayout,
    });
    cleanups.push(() => mounted.unmount());
  }

  const customHost = resolveHost(root, "custom");
  if (customHost) {
    cleanups.push(mountCustomHeadless(customHost, locale));
  }

  const cleanup = (): void => {
    while (cleanups.length > 0) {
      cleanups.pop()?.();
    }
    if (showcaseRoot[cleanupSymbol] === cleanup) {
      delete showcaseRoot[cleanupSymbol];
    }
  };

  showcaseRoot[cleanupSymbol] = cleanup;
  return cleanup;
};
