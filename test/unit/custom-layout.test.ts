// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it } from "vite-plus/test";
import { createFormView, type FormLayoutConfig } from "@/view";
import { mountForm } from "@/kit";

const schema = {
  fields: [
    { kind: "text", id: "material", label: "Material" },
    { kind: "text", id: "speed", label: "Speed" },
  ],
};
const transport = { submit: async () => ({ reports: [] }) };

const layout: FormLayoutConfig = {
  kind: "tabs",
  tabs: [
    {
      id: "formulation",
      title: "Formulation",
      children: [
        {
          kind: "section",
          id: "materials",
          title: "Materials",
          defaultOpen: false,
          children: [{ kind: "custom", id: "editor", fields: ["material"] }],
        },
      ],
    },
    { id: "parameters", title: "Parameters", children: [{ kind: "field", field: "speed" }] },
  ],
};

describe("custom layout regions", () => {
  it("accounts for owned fields in references, navigation and visibility", async () => {
    const view = createFormView({ schema, transport, layout });
    expect(view.getLayoutReferences().fields).toEqual(["material", "speed"]);
    expect(view.getNodeById("editor")).toEqual({
      kind: "custom",
      id: "editor",
      fields: ["material"],
    });
    expect(view.getField("material")?.visibleInLayout).toBe(false);
    view.navigation.disclosure.open("materials");
    expect(view.getField("material")?.visibleInLayout).toBe(true);
    expect(view.getField("speed")?.visibleInLayout).toBe(false);
    await view.navigation.activate("parameters");
    expect(view.getField("material")?.visibleInLayout).toBe(false);
    expect(view.getField("speed")?.visibleInLayout).toBe(true);
    view.dispose();
  });

  it("validates fields owned by a custom region before advancing a wizard", async () => {
    const view = createFormView({
      schema: {
        fields: [
          { kind: "text", id: "material", label: "Material", required: true },
          { kind: "text", id: "speed", label: "Speed" },
        ],
      },
      transport,
      layout: {
        kind: "wizard",
        steps: [
          {
            id: "materials",
            title: "Materials",
            children: [{ kind: "custom", id: "editor", fields: ["material"] }],
          },
          { id: "parameters", title: "Parameters", children: [{ kind: "field", field: "speed" }] },
        ],
      },
    });
    expect(await view.navigation.next()).toBe(false);
    view.form.getField("material")?.setValue("PVA");
    expect(await view.navigation.next()).toBe(true);
    expect(view.getSnapshot().wizard?.currentStepId).toBe("parameters");
    view.dispose();
  });

  it("rejects unknown and duplicate field references through custom regions", () => {
    const create = (fields: string[]) =>
      createFormView({
        schema,
        transport,
        layout: {
          kind: "stacked",
          children: [
            { kind: "custom", id: "editor", fields },
            { kind: "field", field: "speed" },
          ],
        },
      });
    expect(() => create(["missing"])).toThrow('Layout references unknown field "missing".');
    expect(() => create(["material", "material"])).toThrow(
      'Field "material" appears multiple times in layout.',
    );
    expect(() => create(["material", "speed"])).toThrow(
      'Field "speed" appears multiple times in layout.',
    );
    expect(() => create([])).toThrow('Custom region "editor" must declare at least one field.');
  });

  it("fails early when the built-in kit cannot render the custom region", () => {
    const container = document.createElement("div");
    expect(() =>
      mountForm(container, {
        schema,
        transport,
        layout: {
          kind: "stacked",
          children: [
            { kind: "custom", id: "materials", fields: ["material"] },
            { kind: "field", field: "speed" },
          ],
        },
      }),
    ).toThrow('Custom region "materials" requires an application-owned layout.');
    expect(container.childElementCount).toBe(0);
  });
});
