import { createForm } from "@/runtime";
import { createBuiltinTestKit } from "../helpers/builtin-test-kit";
import { z } from "zod";
import { describe, expect, it, vi } from "vitest";

describe("runtime management", () => {
  it("applies and clears external validation errors through the form interface", () => {
    const form = createForm({
      schema: { fields: [{ kind: "text", label: "Name" }] },
      registry: createBuiltinTestKit().registry,
      transport: { submit: vi.fn() },
    });

    form.setExternalErrors({
      form: ["Request rejected."],
      fields: { name: ["Name is already registered."] },
    });

    expect(form.state.status).toBe("error");
    expect(form.state.errors.form).toEqual(["Request rejected."]);
    expect(form.getField("name")?.state.errors).toContain("Name is already registered.");

    form.clearExternalErrors();

    expect(form.state.status).toBe("idle");
    expect(form.state.errors.form).toEqual([]);
    expect(form.getField("name")?.state.errors).toEqual([]);
  });

  it("rejects unknown external error field ids atomically", () => {
    const form = createForm({
      schema: { fields: [{ kind: "text", label: "Name" }] },
      registry: createBuiltinTestKit().registry,
      transport: { submit: vi.fn() },
    });

    expect(() =>
      form.setExternalErrors({
        form: ["Must not be committed."],
        fields: { missing: ["Unknown field."] },
      }),
    ).toThrow('Unknown field "missing"');
    expect(form.state.errors.form).toEqual([]);
  });

  it("disposes pending work and stops future notifications", async () => {
    let resolveTransport = (_value: unknown): void => {};
    const transportResult = new Promise((resolve) => {
      resolveTransport = resolve;
    });
    const listener = vi.fn();
    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name" }],
        reports: [{ kind: "classifier", id: "prediction" }],
      },
      registry: createBuiltinTestKit().registry,
      transport: { submit: vi.fn(() => transportResult) },
    });
    const field = form.fields[0]!;
    const report = form.reports[0]!;
    form.subscribe(listener);
    const submission = form.submit();

    await vi.waitFor(() => expect(form.state.status).toBe("submitting"));
    form.dispose();
    resolveTransport({});

    await expect(submission).rejects.toMatchObject({ name: "SubmissionAbortedError" });
    const callsAfterDispose = listener.mock.calls.length;
    expect(() => form.setValues({ name: "ignored" })).toThrow("disposed");
    expect(() => field.setValue("ignored")).toThrow("disposed");
    await expect(report.fetch({} as never)).rejects.toThrow("disposed");
    expect(listener).toHaveBeenCalledTimes(callsAfterDispose);
  });

  it("refreshes a report after an error", async () => {
    const fetch = vi
      .fn()
      .mockReturnValueOnce({ submit: vi.fn().mockRejectedValue(new Error("offline")) })
      .mockReturnValueOnce({ submit: vi.fn().mockResolvedValue({ value: 42 }) });
    const { registry } = createBuiltinTestKit();
    registry.registerReport({
      kind: "refreshable",
      schema: z.object({ kind: z.literal("refreshable") }).passthrough(),
      fetch,
    });
    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name" }],
        reports: [{ id: "details", kind: "refreshable" }],
      },
      registry,
      transport: { submit: vi.fn() },
    });
    const report = form.getReport("details")!;
    const request = {
      reportId: report.id,
      inputs: [],
      displayValues: {},
      modelValues: {},
      reports: [],
      reportContexts: {},
      meta: {},
      raw: null,
    };

    await report.fetch(request);
    expect(report.state.status).toBe("error");

    await report.refresh(request);

    expect(report.state).toMatchObject({ status: "ready", payload: { value: 42 } });
  });

  it("keeps a refreshed report loading when the replaced request settles", async () => {
    let resolveFirst = (_value: unknown): void => {};
    let resolveSecond = (_value: unknown): void => {};
    const firstResult = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const secondResult = new Promise((resolve) => {
      resolveSecond = resolve;
    });
    const submit = vi.fn().mockReturnValueOnce(firstResult).mockReturnValueOnce(secondResult);
    const { registry } = createBuiltinTestKit();
    registry.registerReport({
      kind: "refresh-race",
      schema: z.object({ kind: z.literal("refresh-race") }).passthrough(),
      fetch: () => ({ submit }),
    });
    const form = createForm({
      schema: { fields: [], reports: [{ id: "details", kind: "refresh-race" }] },
      registry,
      transport: { submit: vi.fn() },
    });
    const report = form.getReport("details")!;
    const request = {
      reportId: report.id,
      inputs: [],
      displayValues: {},
      modelValues: {},
      reports: [],
      reportContexts: {},
      meta: {},
      raw: null,
    };

    const firstFetch = report.fetch(request);
    await vi.waitFor(() => expect(report.state.status).toBe("loading"));
    const refreshedFetch = report.refresh(request);
    resolveFirst({ stale: true });
    await firstFetch;

    expect(report.state.status).toBe("loading");

    resolveSecond({ fresh: true });
    await refreshedFetch;
    expect(report.state).toMatchObject({ status: "ready", payload: { fresh: true } });
  });

  it("ignores a completed fetch when refresh starts before the controller resumes", async () => {
    const firstResult = Promise.withResolvers<unknown>();
    const secondResult = Promise.withResolvers<unknown>();
    const submit = vi
      .fn()
      .mockReturnValueOnce(firstResult.promise)
      .mockReturnValueOnce(secondResult.promise);
    const { registry } = createBuiltinTestKit();
    registry.registerReport({
      kind: "completion-race",
      schema: z.object({ kind: z.literal("completion-race") }).passthrough(),
      fetch: () => ({ submit }),
    });
    const form = createForm({
      schema: { fields: [], reports: [{ id: "details", kind: "completion-race" }] },
      registry,
      transport: { submit: vi.fn() },
    });
    const report = form.getReport("details")!;
    const request = {
      reportId: report.id,
      inputs: [],
      displayValues: {},
      modelValues: {},
      reports: [],
      reportContexts: {},
      meta: {},
      raw: null,
    };

    const firstFetch = report.fetch(request);
    let refreshedFetch: Promise<void> | undefined;
    void firstResult.promise.then(() => {
      refreshedFetch = report.refresh(request);
    });
    firstResult.resolve({ obsolete: true });
    await firstFetch;

    expect(report.state.status).toBe("loading");
    secondResult.resolve({ fresh: true });
    await refreshedFetch;
    expect(report.state).toMatchObject({ status: "ready", payload: { fresh: true } });
  });
});
