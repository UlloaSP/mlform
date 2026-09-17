import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import { createForm, executeFormPipeline, SubmissionAbortedError, SubmitError } from "@/runtime";
import { createRegistry } from "@/schema";
import { createBuiltinTestKit } from "../helpers/builtin-test-kit";

const deferred = () => {
  let resolve = (): void => {};
  const promise = new Promise<void>((next) => {
    resolve = next;
  });
  return { promise, resolve };
};

describe("runtime core invariants", () => {
  it("isolates immutable normalized schema snapshots from extension mutations", async () => {
    let validatorSchema:
      | Parameters<NonNullable<Parameters<typeof createForm>[0]["validators"]>[number]>[0]["schema"]
      | undefined;
    let transportFields: readonly Record<string, unknown>[] | undefined;
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
            mappedTo: "name",
            defaultValue: new Map([["stable", true]]),
          },
        ],
      },
      registry: createBuiltinTestKit().registry,
      validators: [
        (context) => {
          validatorSchema = context.schema;
          const defaultValue = context.schema.fields[0]?.defaultValue as Map<string, boolean>;
          defaultValue.set("mutated", true);
        },
      ],
      transport: {
        async submit(request) {
          transportFields = request.fields as readonly Record<string, unknown>[];
          return {};
        },
      },
    });

    form.setValues({ name: "Ada" });
    await form.submit();

    if (!validatorSchema) throw new Error("Validator did not receive the normalized schema.");
    const schema = validatorSchema;
    expect(Object.isFrozen(schema)).toBe(true);
    expect(Object.isFrozen(schema.fields)).toBe(true);
    expect(Object.isFrozen(schema.fields[0])).toBe(true);
    expect(Object.isFrozen(transportFields)).toBe(true);
    expect(transportFields).not.toBe(schema.fields);
    expect(transportFields?.[0]?.defaultValue).toEqual(new Map([["stable", true]]));
    expect(() => {
      (schema.fields[0] as { label: string }).label = "Mutated";
    }).toThrow(TypeError);
    expect(form.getField("name")?.config.label).toBe("Name");
  });

  it("preserves the primary submission error when onSubmitError fails", async () => {
    const transportError = new Error("transport-root-cause");
    const hookError = new Error("error-hook-failed");
    const onListenerError = vi.fn();
    const form = createForm({
      schema: { fields: [{ kind: "text", label: "Name", mappedTo: "name" }] },
      registry: createBuiltinTestKit().registry,
      transport: { submit: vi.fn().mockRejectedValue(transportError) },
      hooks: { onSubmitError: vi.fn().mockRejectedValue(hookError) },
      onListenerError,
    });

    form.setValues({ name: "Ada" });

    await expect(form.submit()).rejects.toMatchObject({
      name: "SubmitError",
      cause: transportError,
    } satisfies Partial<SubmitError>);
    expect(form.state.errors.form).toEqual(["transport-root-cause"]);
    expect(onListenerError).toHaveBeenCalledWith(hookError);
  });

  it("rejects a submission invalidated by reset while afterSubmit is pending", async () => {
    const gate = deferred();
    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name", mappedTo: "name", defaultValue: "Initial" }],
      },
      registry: createBuiltinTestKit().registry,
      transport: { submit: vi.fn().mockResolvedValue({}) },
      hooks: {
        async afterSubmit() {
          await gate.promise;
        },
      },
    });

    form.setValues({ name: "Ada" });
    const submission = form.submit();
    await vi.waitFor(() => expect(form.state.status).toBe("success"));

    form.reset();

    await expect(submission).rejects.toBeInstanceOf(SubmissionAbortedError);
    expect(form.state.status).toBe("idle");
    expect(form.getValues()).toEqual({ name: "Initial" });
    expect(form.state.lastResult).toBeNull();
    gate.resolve();
  });

  it("reports post-fetch hook failures without losing a successful report", async () => {
    const hookError = new Error("after-fetch-hook-failed");
    const onListenerError = vi.fn();
    const registry = createRegistry().registerReport({
      kind: "remote",
      schema: z.object({ kind: z.literal("remote"), id: z.string().optional() }),
      fetch: () => ({ submit: vi.fn().mockResolvedValue({ score: 1 }) }),
    });
    const form = createForm({
      schema: { fields: [], reports: [{ kind: "remote", id: "remote" }] },
      registry,
      transport: { submit: vi.fn().mockResolvedValue({}) },
      hooks: { afterReportFetch: vi.fn().mockRejectedValue(hookError) },
      onListenerError,
    });

    const result = await executeFormPipeline({ form });

    expect(result.reportFetchResults).toEqual({ remote: { score: 1 } });
    expect(result.reportFetchErrors).toEqual({});
    expect(form.getReport("remote")?.state.status).toBe("ready");
    expect(onListenerError).toHaveBeenCalledWith(hookError);
  });
});
