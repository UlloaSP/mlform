import { z } from "zod";
import { describe, expect, it } from "vitest";
import { createBuiltinMlRegistry } from "@/builtins";
import { createForm } from "@/runtime";
import { createRegistry } from "@/schema";

describe("runtime derived state stabilization", () => {
  it.each(["dependent-first", "source-first"] as const)(
    "stabilizes reset dependencies with %s declaration order",
    (order) => {
      const dependent = {
        id: "dependent",
        kind: "text",
        label: "Dependent",
        hiddenWhen: { kind: "field-value" as const, field: "source", notEquals: 2 },
      };
      const source = {
        id: "source",
        kind: "number",
        label: "Source",
        defaultValue: 1,
        hiddenWhen: { kind: "field-value" as const, field: "toggle", falsy: true },
        inactiveFieldPolicy: "reset-on-hide" as const,
      };
      const form = createForm({
        schema: {
          fields: [
            ...(order === "dependent-first" ? [dependent, source] : [source, dependent]),
            {
              id: "toggle",
              kind: "boolean",
              label: "Toggle",
              defaultValue: true,
            },
          ],
        },
        registry: createBuiltinMlRegistry(),
        transport: { submit: async () => ({}) },
      });

      form.setValues({ source: 2 });
      expect(form.getField("dependent")?.state.visible).toBe(true);

      form.setValues({ toggle: false });

      expect(form.getValues().source).toBe(1);
      expect(form.getField("source")?.state.visible).toBe(false);
      expect(form.getField("dependent")?.state.visible).toBe(false);
    },
  );

  it("fails early when a field normalizer cannot reach a stable value", () => {
    const registry = createRegistry().registerField({
      kind: "unstable",
      schema: z.object({
        kind: z.literal("unstable"),
        label: z.string(),
        defaultValue: z.number().optional(),
      }),
      getDefaultValue: () => 0,
      normalizeValue: (value) => Math.min(Number(value) + 1, 2),
    });

    expect(() =>
      createForm({
        schema: { fields: [{ kind: "unstable", label: "Unstable" }] },
        registry,
        transport: { submit: async () => ({}) },
      }),
    ).toThrow(/normalizer must be idempotent/i);
  });

  it("detects an in-place normalizer that mutates its input", () => {
    const registry = createRegistry().registerField({
      kind: "mutable",
      schema: z.object({ kind: z.literal("mutable"), label: z.string() }),
      getDefaultValue: () => ({ count: 0 }),
      normalizeValue(value) {
        const mutable = value as { count: number };
        mutable.count += 1;
        return mutable;
      },
    });

    expect(() =>
      createForm({
        schema: { fields: [{ id: "mutable", kind: "mutable", label: "Mutable" }] },
        registry,
        transport: { submit: async () => ({}) },
      }),
    ).toThrow(/field "mutable" normalizer must be idempotent/i);
  });
});
