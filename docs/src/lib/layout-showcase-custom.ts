import { attachDesignSystem, builtinDesignSystemRegistry } from "@/design-system";
import { createFormView } from "@/kit";
import type { FormViewSnapshot, ResolvedFormLayoutNode } from "@/kit";
import { createBuiltinPrimitiveRegistry } from "@/primitives";

import {
  copyByLocale,
  createDemoTransport,
  schema,
  tabsLayout,
  type Cleanup,
  type ShowcaseLocale,
} from "./layout-showcase-config";

const createFrame = (
  tagName: "mlf-field-frame" | "mlf-report-frame",
  snapshot: FormViewSnapshot,
  id: string,
  primitiveRegistry: ReturnType<typeof createBuiltinPrimitiveRegistry>,
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
    element.registry = primitiveRegistry;
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
  element.registry = primitiveRegistry;
  element.lastResult = snapshot.form.lastResult;
  return element;
};

const renderCustomNode = (
  node: ResolvedFormLayoutNode,
  snapshot: FormViewSnapshot,
  primitiveRegistry: ReturnType<typeof createBuiltinPrimitiveRegistry>,
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
        const childElement = renderCustomNode(child, snapshot, primitiveRegistry);
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
        const childElement = renderCustomNode(child, snapshot, primitiveRegistry);
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
      return createFrame("mlf-field-frame", snapshot, node.field, primitiveRegistry);
    case "report":
      if (!node.report) {
        return null;
      }
      return createFrame("mlf-report-frame", snapshot, node.report, primitiveRegistry);
  }
};

export const mountCustomHeadless = (host: HTMLElement, locale: ShowcaseLocale): Cleanup => {
  const copy = copyByLocale[locale];
  const view = createFormView({
    schema,
    transport: createDemoTransport(),
    layout: tabsLayout,
  });
  const primitiveRegistry = createBuiltinPrimitiveRegistry();
  const designSystem = attachDesignSystem(host, {
    registry: builtinDesignSystemRegistry,
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
      const nodeElement = renderCustomNode(node, snapshot, primitiveRegistry);
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
