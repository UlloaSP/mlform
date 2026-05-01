// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import * as z from "zod";
import { createBuiltinRegistry, defineExplanationKind } from "@/engine";
import { collectLayoutReferences, createFormView, flattenLayoutNodes } from "@/kit";

describe("kit view", () => {
  it("builds an automatic single-page layout when layout is omitted", () => {
    const registry = createBuiltinRegistry();
    registry.registerExplanation(
      defineExplanationKind({
        kind: "mock-explanation",
        schema: z.object({
          id: z.string().optional(),
          kind: z.literal("mock-explanation"),
          label: z.string().optional(),
        }),
        fetch: () => ({
          submit: async () => ({ items: [] }),
        }),
        render: {
          content: () => [],
        },
      }),
    );

    const view = createFormView({
      transport: {
        submit: vi.fn().mockResolvedValue({ reports: {} }),
      },
      schema: {
        fields: [
          { id: "name", kind: "text", label: "Name" },
          { id: "age", kind: "number", label: "Age" },
        ],
        explanations: [{ id: "why", kind: "mock-explanation", label: "Why" }],
        reports: [{ id: "risk", kind: "classifier", label: "Risk" }],
      },
      registry,
    });

    const snapshot = view.getSnapshot();

    expect(snapshot.layout.kind).toBe("single-page");
    expect(snapshot.layout.kind === "single-page" ? snapshot.layout.children : []).toEqual([
      { kind: "field", field: "name" },
      { kind: "field", field: "age" },
      { kind: "explanation", explanation: "why" },
      { kind: "report", report: "risk" },
    ]);
    expect(snapshot.wizard).toBeNull();
  });

  it("creates wizard state, validates only current step, and supports navigation", async () => {
    const submit = vi.fn().mockResolvedValue({ reports: {} });
    const view = createFormView({
      transport: { submit },
      schema: {
        fields: [
          { id: "name", kind: "text", label: "Name", required: true },
          { id: "email", kind: "text", label: "Email", required: true },
        ],
      },
      layout: {
        kind: "wizard",
        steps: [
          {
            title: "Profile",
            children: [{ kind: "field", field: "name" }],
          },
          {
            title: "Contact",
            children: [{ kind: "field", field: "email" }],
          },
        ],
      },
    });

    expect(view.getSnapshot().wizard).toMatchObject({
      stepIndex: 0,
      stepCount: 2,
      canPrev: false,
      isLastStep: false,
    });

    await expect(view.nextStep()).resolves.toBe(false);
    expect(view.form.getField("name")?.state.errors).toContain("This field is required.");

    view.form.getField("name")?.setValue("Alice");

    await expect(view.nextStep()).resolves.toBe(true);
    expect(view.getSnapshot().wizard).toMatchObject({
      stepIndex: 1,
      currentStepId: "contact",
      canPrev: true,
      isLastStep: true,
    });

    await expect(view.goToStep("profile")).resolves.toBe(true);
    expect(view.getSnapshot().wizard?.stepIndex).toBe(0);

    view.form.getField("name")?.setValue("Alice");
    await expect(view.goToStep("contact")).resolves.toBe(true);
  });

  it("resolves tabs layouts, tracks the active tab, and scopes layout visibility", () => {
    const registry = createBuiltinRegistry();
    registry.registerExplanation(
      defineExplanationKind({
        kind: "mock-explanation",
        schema: z.object({
          id: z.string().optional(),
          kind: z.literal("mock-explanation"),
          label: z.string().optional(),
        }),
        fetch: () => ({
          submit: async () => ({ items: [] }),
        }),
        render: {
          content: () => [],
        },
      }),
    );

    const view = createFormView({
      transport: { submit: vi.fn().mockResolvedValue({ reports: {} }) },
      schema: {
        fields: [
          { id: "name", kind: "text", label: "Name" },
          { id: "email", kind: "text", label: "Email" },
        ],
        reports: [{ id: "risk", kind: "classifier", label: "Risk" }],
        explanations: [{ id: "why", kind: "mock-explanation", label: "Why" }],
      },
      registry,
      layout: {
        kind: "tabs",
        tabs: [
          {
            title: "Profile",
            children: [
              { kind: "field", field: "name" },
              { kind: "explanation", explanation: "why" },
            ],
          },
          {
            title: "Contact",
            children: [
              { kind: "field", field: "email" },
              { kind: "report", report: "risk" },
            ],
          },
        ],
      },
    });

    expect(view.getSnapshot().layout.kind).toBe("tabs");
    expect(view.getSnapshot().tabs).toMatchObject({
      activeTabIndex: 0,
      tabCount: 2,
      currentTabId: "profile",
      canGoNext: true,
      canGoPrev: false,
    });
    expect(view.getField("name")?.visibleInLayout).toBe(true);
    expect(view.getField("email")?.visibleInLayout).toBe(false);
    expect(view.getExplanation("why")?.visibleInLayout).toBe(true);
    expect(view.getReport("risk")?.visibleInLayout).toBe(false);

    expect(view.nextTab()).toBe(true);
    expect(view.getSnapshot().tabs).toMatchObject({
      activeTabIndex: 1,
      currentTabId: "contact",
      canGoNext: false,
      canGoPrev: true,
    });
    expect(view.getField("name")?.visibleInLayout).toBe(false);
    expect(view.getField("email")?.visibleInLayout).toBe(true);
    expect(view.getExplanation("why")?.visibleInLayout).toBe(false);
    expect(view.getReport("risk")?.visibleInLayout).toBe(true);

    view.setActiveTab("profile");
    expect(view.getSnapshot().tabs?.activeTabIndex).toBe(0);
    expect(view.prevTab()).toBe(false);
  });

  it("rejects invalid tabs layouts and tab navigation on non-tabs views", () => {
    expect(() =>
      createFormView({
        transport: { submit: vi.fn().mockResolvedValue({ reports: {} }) },
        schema: {
          fields: [{ id: "name", kind: "text", label: "Name" }],
        },
        layout: {
          kind: "tabs",
          tabs: [],
        },
      }),
    ).toThrow("Tabs layout must define at least one tab.");

    expect(() =>
      createFormView({
        transport: { submit: vi.fn().mockResolvedValue({ reports: {} }) },
        schema: {
          fields: [{ id: "name", kind: "text", label: "Name" }],
        },
        layout: {
          kind: "tabs",
          tabs: [{ title: "Empty", children: [] }],
        },
      }),
    ).toThrow('Tab "empty" must contain at least one layout node.');

    expect(() =>
      createFormView({
        transport: { submit: vi.fn().mockResolvedValue({ reports: {} }) },
        schema: {
          fields: [
            { id: "name", kind: "text", label: "Name" },
            { id: "email", kind: "text", label: "Email" },
          ],
        },
        layout: {
          kind: "tabs",
          tabs: [
            {
              title: "One",
              children: [
                { kind: "field", field: "name" },
                { kind: "field", field: "name" },
              ],
            },
          ],
        },
      }),
    ).toThrow('Field "name" appears multiple times in layout.');

    expect(() =>
      createFormView({
        transport: { submit: vi.fn().mockResolvedValue({ reports: {} }) },
        schema: {
          fields: [
            { id: "name", kind: "text", label: "Name" },
            { id: "email", kind: "text", label: "Email" },
          ],
        },
        layout: {
          kind: "tabs",
          tabs: [
            {
              title: "One",
              children: [{ kind: "field", field: "name" }],
            },
          ],
        },
      }),
    ).toThrow('Field "email" is missing from layout.');

    const singlePageView = createFormView({
      transport: { submit: vi.fn().mockResolvedValue({ reports: {} }) },
      schema: {
        fields: [{ id: "name", kind: "text", label: "Name" }],
      },
    });

    expect(singlePageView.nextTab()).toBe(false);
    expect(singlePageView.prevTab()).toBe(false);
    expect(() => singlePageView.setActiveTab("anything")).toThrow(
      "setActiveTab() is only available for tabs layouts.",
    );
  });

  it("exposes headless helper APIs and layout utilities", () => {
    const view = createFormView({
      transport: { submit: vi.fn().mockResolvedValue({ reports: {} }) },
      schema: {
        fields: [{ id: "name", kind: "text", label: "Name" }],
      },
      layout: {
        kind: "single-page",
        children: [
          {
            kind: "section",
            title: "Profile",
            children: [{ kind: "field", field: "name" }],
          },
        ],
      },
    });

    const snapshot = view.getSnapshot();
    expect(view.getVisibleFields().map((field) => field.id)).toEqual(["name"]);
    expect(view.getVisibleReports()).toEqual([]);
    expect(view.getVisibleExplanations()).toEqual([]);
    expect(view.getActiveLayoutNodes()).toHaveLength(1);
    expect(view.getNodeById("profile")?.kind).toBe("section");
    expect(flattenLayoutNodes(snapshot.layout).map((node) => node.kind)).toEqual([
      "section",
      "field",
    ]);
    expect(collectLayoutReferences(snapshot.layout)).toEqual({
      fields: ["name"],
      reports: [],
      explanations: [],
    });
    expect(view.getLayoutReferences()).toEqual({
      fields: ["name"],
      reports: [],
      explanations: [],
    });
  });

  it("resolves accordion layouts and supports multi-open section controls", () => {
    const view = createFormView({
      transport: { submit: vi.fn().mockResolvedValue({ reports: {} }) },
      schema: {
        fields: [
          { id: "name", kind: "text", label: "Name" },
          { id: "email", kind: "text", label: "Email" },
        ],
        reports: [{ id: "risk", kind: "classifier", label: "Risk" }],
      },
      layout: {
        kind: "accordion",
        sections: [
          {
            title: "Profile",
            children: [{ kind: "field", field: "name" }],
          },
          {
            title: "Details",
            children: [
              { kind: "field", field: "email" },
              { kind: "report", report: "risk" },
            ],
          },
        ],
      },
    });

    expect(view.getSnapshot().accordion).toEqual({
      openSectionIds: ["profile"],
      sectionCount: 2,
    });
    expect(view.getField("name")?.visibleInLayout).toBe(true);
    expect(view.getField("email")?.visibleInLayout).toBe(false);

    view.openSection("details");
    expect(view.getSnapshot().accordion?.openSectionIds).toEqual(["profile", "details"]);
    expect(view.getField("email")?.visibleInLayout).toBe(true);
    expect(view.getReport("risk")?.visibleInLayout).toBe(true);

    view.closeSection("profile");
    expect(view.getSnapshot().accordion?.openSectionIds).toEqual(["details"]);
    expect(view.getField("name")?.visibleInLayout).toBe(false);

    view.openAllSections();
    expect(view.getSnapshot().accordion?.openSectionIds).toEqual(["profile", "details"]);

    view.closeAllSections();
    expect(view.getSnapshot().accordion?.openSectionIds).toEqual([]);
    expect(view.getActiveLayoutNodes()).toEqual([]);
  });

  it("rejects invalid accordion layouts and section controls on non-accordion views", () => {
    expect(() =>
      createFormView({
        transport: { submit: vi.fn().mockResolvedValue({ reports: {} }) },
        schema: {
          fields: [{ id: "name", kind: "text", label: "Name" }],
        },
        layout: {
          kind: "accordion",
          sections: [],
        },
      }),
    ).toThrow("Accordion layout must define at least one section.");

    expect(() =>
      createFormView({
        transport: { submit: vi.fn().mockResolvedValue({ reports: {} }) },
        schema: {
          fields: [{ id: "name", kind: "text", label: "Name" }],
        },
        layout: {
          kind: "accordion",
          sections: [{ title: "Empty", children: [] }],
        },
      }),
    ).toThrow('Accordion section "empty" must contain at least one layout node.');

    const singlePageView = createFormView({
      transport: { submit: vi.fn().mockResolvedValue({ reports: {} }) },
      schema: {
        fields: [{ id: "name", kind: "text", label: "Name" }],
      },
    });

    expect(() => singlePageView.toggleSection("anything")).toThrow(
      "Accordion section controls are only available for accordion layouts.",
    );
  });

  it("rejects duplicate or missing fields in explicit layouts", () => {
    expect(() =>
      createFormView({
        transport: {
          submit: vi.fn().mockResolvedValue({ reports: {} }),
        },
        schema: {
          fields: [
            { id: "name", kind: "text", label: "Name" },
            { id: "email", kind: "text", label: "Email" },
          ],
        },
        layout: {
          kind: "wizard",
          steps: [
            {
              title: "Only",
              children: [
                { kind: "field", field: "name" },
                { kind: "field", field: "name" },
              ],
            },
          ],
        },
      }),
    ).toThrow('Field "name" appears multiple times in layout.');

    expect(() =>
      createFormView({
        transport: {
          submit: vi.fn().mockResolvedValue({ reports: {} }),
        },
        schema: {
          fields: [
            { id: "name", kind: "text", label: "Name" },
            { id: "email", kind: "text", label: "Email" },
          ],
        },
        layout: {
          kind: "wizard",
          steps: [
            {
              title: "Only",
              children: [{ kind: "field", field: "name" }],
            },
          ],
        },
      }),
    ).toThrow('Field "email" is missing from layout.');
  });
});
