import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import { createForm, type RuntimeBehavior } from "@/runtime";
import { createRegistry } from "@/schema";
import { createBuiltinMlRegistry } from "@/builtins";

const createBehaviorForm = (behavior: RuntimeBehavior) => {
  const registry = createRegistry().registerField({
    kind: "value",
    schema: z
      .object({
        id: z.string().optional(),
        kind: z.literal("value"),
        label: z.string(),
        defaultValue: z.unknown().optional(),
      })
      .passthrough(),
    getDefaultValue: (config) => config.defaultValue ?? null,
  });

  return createForm({
    schema: {
      fields: [
        { id: "source", kind: "value", label: "Source", defaultValue: 0 },
        { id: "derived", kind: "value", label: "Derived", defaultValue: "initial" },
      ],
    },
    registry,
    behaviors: [behavior],
    transport: { submit: vi.fn() },
  });
};

describe("runtime behaviors", () => {
  it("activates built-in derived behavior through the registered definition", () => {
    const form = createForm({
      schema: {
        fields: [
          {
            id: "color",
            kind: "mapped-category",
            label: "Color",
            options: [{ label: "Red", value: "red", mapping: { is_red: 1 } }],
          },
          {
            id: "is_red",
            kind: "number",
            label: "is_red",
            hidden: true,
            inactiveFieldPolicy: "include",
          },
        ],
      },
      registry: createBuiltinMlRegistry(),
      transport: { submit: vi.fn() },
    });

    form.setValues({ color: "red" });

    expect(form.getValues()).toMatchObject({ color: "red", "is-red": 1 });
  });

  it("prevents an obsolete asynchronous behavior from committing derived values", async () => {
    let releaseFirst = (): void => {};
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const behavior: RuntimeBehavior = {
      async onValuesChanged(event, context) {
        if (event.fieldId !== "source") return;
        if (event.values.source === 1) await firstGate;
        context.commitDerivedValue("derived", event.values.source === 1 ? "obsolete" : "current");
      },
    };
    const form = createBehaviorForm(behavior);

    form.setValues({ source: 1 });
    form.setValues({ source: 2 });
    await Promise.resolve();
    expect(form.getValues().derived).toBe("current");

    releaseFirst();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(form.getValues().derived).toBe("current");
  });

  it("cleans up submission state when a pre-submit behavior fails", async () => {
    const behavior: RuntimeBehavior = {
      beforeSubmitRecords: vi
        .fn()
        .mockRejectedValueOnce(new Error("record transformation failed"))
        .mockResolvedValue(undefined),
    };
    const form = createBehaviorForm(behavior);

    await expect(form.submit()).rejects.toMatchObject({ name: "SubmitError" });
    await expect(form.submit()).resolves.toMatchObject({ modelValues: {} });
  });
});
