import { z } from "zod";
import { describe, expect, it } from "vitest";
import { RegistryError as RuntimeRegistryError } from "@/runtime";
import { createRegistry, RegistryError as SchemaRegistryError } from "@/schema";
import * as runtime from "@/runtime";
import * as kit from "@/kit";
import * as view from "@/view";

describe("public module surfaces", () => {
  it("uses one RegistryError identity across schema and runtime", () => {
    const registry = createRegistry().registerField({
      kind: "text",
      schema: z.any(),
    });

    expect(() => registry.registerField({ kind: "text", schema: z.any() })).toThrow(
      RuntimeRegistryError,
    );
    expect(RuntimeRegistryError).toBe(SchemaRegistryError);
  });

  it("keeps compatibility aliases and registration shims out of the public surface", () => {
    expect(runtime).not.toHaveProperty("createFormRuntime");
    expect(runtime).not.toHaveProperty("identity");
    expect(runtime).not.toHaveProperty("isPromiseLike");
    expect(view).not.toHaveProperty("defineMlformPlugin");
    expect(view).not.toHaveProperty("registerDefinedFieldKind");
    expect(view).not.toHaveProperty("registerDefinedReportKind");
    expect(view).toHaveProperty("defineMLFormPlugin");
    expect(kit).not.toHaveProperty("createFormView");
    expect(kit).toHaveProperty("mountForm");
  });
});
