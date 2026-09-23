// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import * as z from "zod";
import { createBuiltinTestKit, registerDefinedReportKind } from "../helpers/builtin-test-kit";
import {
  collectLayoutReferences,
  createFormView,
  defineReportKind,
  flattenLayoutNodes,
} from "@/view";
import { createPrimitiveDescriptorRegistry } from "@/primitives";

const reportPayload = (reports: readonly unknown[], id: string): unknown => {
  const item = reports.find(
    (report): report is Record<string, unknown> =>
      typeof report === "object" &&
      report !== null &&
      !Array.isArray(report) &&
      ((report as Record<string, unknown>).id === id ||
        (report as Record<string, unknown>).mappedTo === id),
  );
  return item && "payload" in item ? item.payload : item;
};

describe("kit view", () => {
  it("defers descriptor work until an observer or caller needs a snapshot", () => {
    const describe = vi.fn(() => ({ component: "text", props: { label: "Name" } }));
    const descriptorRegistry = createPrimitiveDescriptorRegistry().registerField({
      kind: "text",
      describe,
    });
    const view = createFormView({
      transport: { submit: async () => ({ reports: [] }) },
      schema: { fields: [{ id: "name", kind: "text", label: "Name" }] },
      descriptorRegistry,
    });

    view.form.getField("name")?.setValue("Ada");
    expect(describe).not.toHaveBeenCalled();
    expect(view.getSnapshot().fields[0]?.state.value).toBe("Ada");
    expect(describe).toHaveBeenCalledOnce();
    view.dispose();
  });

  it("caches snapshots until form or navigation state changes", () => {
    const view = createFormView({
      transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
      schema: { fields: [{ id: "name", kind: "text", label: "Name" }] },
    });

    const initial = view.getSnapshot();
    expect(view.getSnapshot()).toBe(initial);
    view.form.getField("name")?.setValue("Ada");
    expect(view.getSnapshot()).not.toBe(initial);
    expect(view.getSnapshot().fields[0]?.state.value).toBe("Ada");
    view.dispose();
  });

  it("tracks every enclosing section when resolving visibility", () => {
    const view = createFormView({
      transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
      schema: { fields: [{ id: "name", kind: "text", label: "Name" }] },
      layout: {
        kind: "stacked",
        children: [
          {
            kind: "section",
            title: "Outer",
            defaultOpen: false,
            children: [
              {
                kind: "section",
                title: "Inner",
                children: [{ kind: "field", field: "name" }],
              },
            ],
          },
        ],
      },
    });

    expect(view.getField("name")?.sectionIds).toEqual(["outer", "inner"]);
    expect(view.getField("name")?.visibleInLayout).toBe(false);
    view.navigation.disclosure.open("outer");
    expect(view.getField("name")?.visibleInLayout).toBe(true);
    view.navigation.disclosure.close("inner");
    expect(view.getField("name")?.visibleInLayout).toBe(false);
    expect(view.navigation.getActiveNodes()).toMatchObject([{ kind: "section", children: [] }]);
    view.dispose();
  });

  it("rejects a disclosure section without an accessible title", () => {
    expect(() =>
      createFormView({
        transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
        schema: { fields: [{ id: "name", kind: "text", label: "Name" }] },
        layout: {
          kind: "stacked",
          children: [{ kind: "section", children: [{ kind: "field", field: "name" }] }],
        } as never,
      }),
    ).toThrow("Disclosure sections require a non-empty title.");
  });

  it("builds an automatic stacked layout when layout is omitted", () => {
    const pack = createBuiltinTestKit();
    registerDefinedReportKind(
      pack.registry,
      pack.descriptorRegistry,
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
        resolve: ({ result }) => reportPayload(result.reports, "mock-report"),
        render: {
          content: () => [],
        },
      }),
    );

    const view = createFormView({
      transport: {
        submit: vi.fn().mockResolvedValue({ reports: [] }),
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
      descriptorRegistry: pack.descriptorRegistry,
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
    const submit = vi.fn().mockResolvedValue({ reports: [] });
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

    await expect(view.navigation.next()).resolves.toBe(false);
    expect(view.form.getField("name")?.state.errors).toContain("This field is required.");

    view.form.getField("name")?.setValue("Alice");

    await expect(view.navigation.next()).resolves.toBe(true);
    expect(view.getSnapshot().wizard).toMatchObject({
      stepIndex: 1,
      currentStepId: "contact",
      canPrev: true,
      isLastStep: true,
    });

    await expect(view.navigation.activate("profile")).resolves.toBe(true);
    expect(view.getSnapshot().wizard?.stepIndex).toBe(0);

    view.form.getField("name")?.setValue("Alice");
    await expect(view.navigation.activate("contact")).resolves.toBe(true);
    await expect(view.navigation.activate("missing")).rejects.toThrow(
      'Unknown wizard step "missing".',
    );
    expect(view.navigation.previous()).toBe(true);
    expect(view.getSnapshot().wizard?.currentStepId).toBe("profile");
  });

  it("resolves tabs layouts, tracks the active tab, and scopes layout visibility", async () => {
    const pack = createBuiltinTestKit();
    registerDefinedReportKind(
      pack.registry,
      pack.descriptorRegistry,
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
        resolve: ({ result }) => reportPayload(result.reports, "mock-report"),
        render: {
          content: () => [],
        },
      }),
    );

    const view = createFormView({
      transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
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
      descriptorRegistry: pack.descriptorRegistry,
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

    await expect(view.navigation.next()).resolves.toBe(true);
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

    await view.navigation.activate("profile");
    expect(view.getSnapshot().tabs?.activeTabIndex).toBe(0);
    expect(view.navigation.previous()).toBe(false);
    await expect(view.navigation.activate("missing")).rejects.toThrow('Unknown tab "missing".');
  });

  it("rejects invalid tabs layouts and leaves static navigation inert", async () => {
    expect(() =>
      createFormView({
        transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
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
        transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
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
        transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
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
        transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
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
      transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
      schema: {
        fields: [{ id: "name", kind: "text", label: "Name" }],
      },
    });

    await expect(singlePageView.navigation.next()).resolves.toBe(false);
    expect(singlePageView.navigation.previous()).toBe(false);
    await expect(singlePageView.navigation.activate("anything")).resolves.toBe(false);
  });

  it("exposes headless helper APIs and layout utilities", () => {
    const view = createFormView({
      transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
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
    expect(view.navigation.getActiveNodes()).toHaveLength(1);
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
    expect(view.navigation.kind).toBe("stacked");
    expect(view).not.toHaveProperty("nextStep");
    expect(view).not.toHaveProperty("setActiveTab");
    expect(view).not.toHaveProperty("openSection");
  });

  it("resolves disclosure sections and supports multi-open section controls", () => {
    const view = createFormView({
      transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
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

    view.navigation.disclosure.open("details");
    expect(view.getSnapshot().disclosure?.openSectionIds).toEqual(["profile", "details"]);
    expect(view.getField("email")?.visibleInLayout).toBe(true);
    expect(view.getReport("risk")?.visibleInLayout).toBe(true);

    view.navigation.disclosure.close("profile");
    expect(view.getSnapshot().disclosure?.openSectionIds).toEqual(["details"]);
    expect(view.getField("name")?.visibleInLayout).toBe(false);

    view.navigation.disclosure.openAll();
    expect(view.getSnapshot().disclosure?.openSectionIds).toEqual(["profile", "details"]);

    view.navigation.disclosure.closeAll();
    expect(view.getSnapshot().disclosure?.openSectionIds).toEqual([]);
    expect(view.navigation.getActiveNodes()).toEqual([]);
  });

  it("rejects unknown disclosure section controls", () => {
    const singlePageView = createFormView({
      transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
      schema: {
        fields: [{ id: "name", kind: "text", label: "Name" }],
      },
    });

    expect(() => singlePageView.navigation.disclosure.toggle("anything")).toThrow(
      'Unknown disclosure section "anything".',
    );
  });

  it("rejects duplicate or missing fields in explicit layouts", () => {
    expect(() =>
      createFormView({
        transport: {
          submit: vi.fn().mockResolvedValue({ reports: [] }),
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
          submit: vi.fn().mockResolvedValue({ reports: [] }),
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
