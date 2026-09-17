import { describe, expect, it, vi } from "vitest";
import { createBuiltinMlRegistry } from "@/builtins";
import { createForm } from "@/runtime";

describe("runtime listener error isolation", () => {
  it("keeps notifying listeners when the error observer itself throws", () => {
    const observerError = new Error("observer failed");
    const onListenerError = vi.fn(() => {
      throw observerError;
    });
    const healthyListener = vi.fn();
    const form = createForm({
      schema: { fields: [{ kind: "text", label: "Name" }] },
      registry: createBuiltinMlRegistry(),
      transport: { submit: async () => ({}) },
      listenerErrorPolicy: "ignore",
      onListenerError,
    });

    form.subscribe(() => {
      throw new Error("listener failed");
    });
    form.subscribe(healthyListener);

    expect(() => form.setValues({ name: "Ada" })).not.toThrow();
    expect(form.getValues()).toEqual({ name: "Ada" });
    expect(onListenerError).toHaveBeenCalledOnce();
    expect(healthyListener).toHaveBeenCalledOnce();
  });
});
