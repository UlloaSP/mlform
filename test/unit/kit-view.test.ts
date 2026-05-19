// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import * as z from "zod";
import { createMlRegistryPack } from "@/builtins-ml";
import { defineReportKind, registerDefinedReportKind } from "@/presentation";
import { collectLayoutReferences, createFormView, flattenLayoutNodes } from "@/kit";

describe("kit view", () => {
  it("builds an automatic stacked layout when layout is omitted", () => {
    const pack = createMlRegistryPack();
    registerDefinedReportKind(
      pack.registry,
      pack.presentationRegistry,
      defineReportKind({
        kind: "mock-report",
        schema: z.object({
          id: z.string().optional(),
          kind: z.literal("mock-report"),
          label: z.string().optional(),
        }),
        fetch: () => ({
          submit: async () => ({ items: [] }),
        }),
        resolve: ({ result }) => result.reports["mock-report"],
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
        reports: [
          { id: "why", kind: "mock-report", label: "Why" },
          { id: "risk", kind: "classifier", label: "Risk" },
        ],
      },
      registry: pack.registry,
      presentationRegistry: pack.presentationRegistry,
    });

    const snapshot = view.getSnapshot();

    expect(snapshot.layout.kind).toBe("stacked");
    expect(snapshot.layout.kind === "stacked" ? snapshot.layout.children : []).toEqual([
      { kind: "field", field: "name" },
      { kind: "field", field: "age" },
      { kind: "report", report: "why" },
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
    const pack = createMlRegistryPack();
    registerDefinedReportKind(
      pack.registry,
      pack.presentationRegistry,
      defineReportKind({
        kind: "mock-report",
        schema: z.object({
          id: z.string().optional(),
          kind: z.literal("mock-report"),
          label: z.string().optional(),
        }),
        fetch: () => ({
          submit: async () => ({ items: [] }),
        }),
        resolve: ({ result }) => result.reports["mock-report"],
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
        reports: [
          { id: "why", kind: "mock-report", label: "Why" },
          { id: "risk", kind: "classifier", label: "Risk" },
        ],
      },
      registry: pack.registry,
      presentationRegistry: pack.presentationRegistry,
      layout: {
        kind: "tabs",
        tabs: [
          {
            title: "Profile",
            children: [
              { kind: "field", field: "name" },
              { kind: "report", report: "why" },
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
    expect(view.getReport("why")?.visibleInLayout).toBe(true);
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
    expect(view.getReport("why")?.visibleInLayout).toBe(false);
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
        kind: "stacked",
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
    expect(view.getActiveLayoutNodes()).toHaveLength(1);
    expect(view.getNodeById("profile")?.kind).toBe("section");
    expect(flattenLayoutNodes(snapshot.layout).map((node) => node.kind)).toEqual([
      "section",
      "field",
    ]);
    expect(collectLayoutReferences(snapshot.layout)).toEqual({
      fields: ["name"],
      reports: [],
    });
    expect(view.getLayoutReferences()).toEqual({
      fields: ["name"],
      reports: [],
    });
  });

  it("resolves disclosure sections and supports multi-open section controls", () => {
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
        kind: "stacked",
        children: [
          {
            kind: "section",
            title: "Profile",
            children: [{ kind: "field", field: "name" }],
          },
          {
            kind: "section",
            title: "Details",
            defaultOpen: false,
            children: [
              { kind: "field", field: "email" },
              { kind: "report", report: "risk" },
            ],
          },
        ],
      },
    });

    expect(view.getSnapshot().disclosure).toEqual({
      openSectionIds: ["profile"],
      sectionCount: 2,
    });
    expect(view.getField("name")?.visibleInLayout).toBe(true);
    expect(view.getField("email")?.visibleInLayout).toBe(false);

    view.openSection("details");
    expect(view.getSnapshot().disclosure?.openSectionIds).toEqual(["profile", "details"]);
    expect(view.getField("email")?.visibleInLayout).toBe(true);
    expect(view.getReport("risk")?.visibleInLayout).toBe(true);

    view.closeSection("profile");
    expect(view.getSnapshot().disclosure?.openSectionIds).toEqual(["details"]);
    expect(view.getField("name")?.visibleInLayout).toBe(false);

    view.openAllSections();
    expect(view.getSnapshot().disclosure?.openSectionIds).toEqual(["profile", "details"]);

    view.closeAllSections();
    expect(view.getSnapshot().disclosure?.openSectionIds).toEqual([]);
    expect(view.getActiveLayoutNodes()).toEqual([]);
  });

  it("rejects unknown disclosure section controls", () => {
    const singlePageView = createFormView({
      transport: { submit: vi.fn().mockResolvedValue({ reports: {} }) },
      schema: {
        fields: [{ id: "name", kind: "text", label: "Name" }],
      },
    });

    expect(() => singlePageView.toggleSection("anything")).toThrow(
      'Unknown disclosure section "anything".',
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
