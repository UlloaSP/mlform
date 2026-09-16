import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import { createForm, SubmissionAbortedError } from "@/runtime";
import { createRegistry } from "@/schema";
import { createBuiltinTestKit } from "../helpers/builtin-test-kit";
import { readyReport } from "../report-result";

describe("runtime validation lifecycle", () => {
  it("does not probe asynchronous validators during initialization or execute them twice", async () => {
    const validate = vi.fn(async () => [] as string[]);
    const registry = createRegistry().registerField({
      kind: "async-text",
      schema: z
        .object({
          id: z.string().optional(),
          kind: z.literal("async-text"),
          label: z.string(),
        })
        .passthrough(),
      getDefaultValue: () => "",
      validate,
    });
    const form = createForm({
      schema: { fields: [{ kind: "async-text", label: "Name" }] },
      registry,
      transport: { submit: vi.fn() },
    });

    expect(validate).not.toHaveBeenCalled();

    await form.getField("name")?.validate();

    expect(validate).toHaveBeenCalledTimes(1);
  });

  it("does not commit report payloads resolved after submission is aborted", async () => {
    let releaseResolver = (): void => {};
    let markResolverStarted = (): void => {};
    const resolverStarted = new Promise<void>((resolve) => {
      markResolverStarted = resolve;
    });
    const resolverGate = new Promise<void>((resolve) => {
      releaseResolver = resolve;
    });
    const { registry } = createBuiltinTestKit();
    registry.registerReport({
      kind: "slow-report",
      schema: z
        .object({
          id: z.string().optional(),
          kind: z.literal("slow-report"),
          mappedTo: z.string(),
        })
        .passthrough(),
      async resolvePayload() {
        markResolverStarted();
        await resolverGate;
        return "late payload";
      },
    });
    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name", mappedTo: "name" }],
        reports: [{ kind: "slow-report", id: "slow", mappedTo: "slow" }],
      },
      registry,
      transport: {
        submit: vi.fn().mockResolvedValue({ reports: [readyReport("slow", "raw")] }),
      },
    });

    const submission = form.submit();
    await resolverStarted;
    form.abortSubmit("cancelled-during-report-resolution");
    releaseResolver();

    await expect(submission).rejects.toBeInstanceOf(SubmissionAbortedError);
    expect(form.state.status).toBe("idle");
    expect(form.getReport("slow")?.state).toEqual({
      payload: undefined,
      error: null,
      status: "idle",
    });
  });

  it("exposes an immutable form state snapshot with stable identity", () => {
    const registry = createRegistry().registerField({
      kind: "object-field",
      schema: z
        .object({
          id: z.string().optional(),
          kind: z.literal("object-field"),
          label: z.string(),
        })
        .passthrough(),
      getDefaultValue: () => ({ nested: { count: 1 } }),
    });
    const form = createForm({
      schema: { fields: [{ kind: "object-field", label: "Payload" }] },
      registry,
      transport: { submit: vi.fn() },
    });
    const state = form.state;

    expect(form.state).toBe(state);
    expect(Object.isFrozen(state)).toBe(true);
    expect(Object.isFrozen(state.values.payload)).toBe(true);
    expect(() => {
      (state.values.payload as { nested: { count: number } }).nested.count = 99;
    }).toThrow(TypeError);
    expect(form.state.values.payload).toEqual({ nested: { count: 1 } });
  });
});
