// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { z } from "zod";
import { createBuiltinTestKit } from "../helpers/builtin-test-kit";
import {
  createForm,
  createMultiBackendSubmissionSnapshot,
  createSubmissionSnapshot,
  EngineError,
  executeFormPipeline,
  executeMultiBackendPipeline,
  SubmissionAbortedError,
} from "mlform/runtime";
import { createFanoutTransport, type SubmitRequest } from "mlform/transport";

const createNameForm = (submit: (request: SubmitRequest) => Promise<unknown>, extra = {}) =>
  createForm({
    schema: { fields: [{ kind: "text", label: "Name", mappedTo: "name" }] },
    registry: createBuiltinTestKit().registry,
    transport: { submit },
    ...extra,
  });

describe("transport and submission conformance", () => {
  it("exposes immutable submission snapshots and transport requests", async () => {
    const submit = vi.fn(async (request: SubmitRequest) => {
      expect(Object.isFrozen(request)).toBe(true);
      expect(Object.isFrozen(request.inputs)).toBe(true);
      expect(Object.isFrozen(request.modelValues)).toBe(true);
      expect(Object.isFrozen(request.fields)).toBe(true);
      expect(() => {
        (request.modelValues as Record<string, unknown>).name = "mutated";
      }).toThrow(TypeError);
      return { reports: [] };
    });
    const form = createNameForm(submit);
    form.setValues({ name: "Ada" });

    const snapshot = createSubmissionSnapshot(form);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.inputs)).toBe(true);
    expect(Object.isFrozen(snapshot.modelValues)).toBe(true);
    expect(() => {
      (snapshot.modelValues as Record<string, unknown>).name = "mutated";
    }).toThrow(TypeError);

    await expect(form.submit()).resolves.toMatchObject({ modelValues: { name: "Ada" } });
  });

  it("normalizes structured transport failures without losing the cause", async () => {
    const cause = { message: "backend structured failure", status: 503 };
    const form = createNameForm(vi.fn().mockRejectedValue(cause));

    await expect(form.submit()).rejects.toMatchObject({
      name: "SubmitError",
      message: "Form submission failed: backend structured failure",
      cause,
    });
    expect(form.state.errors.form).toEqual(["backend structured failure"]);
  });

  it("rejects malformed transport metadata", async () => {
    const form = createNameForm(vi.fn().mockResolvedValue({ reports: [], meta: "invalid" }));

    await expect(form.submit()).rejects.toMatchObject({
      name: "SubmitError",
      cause: expect.objectContaining({
        message: 'Invalid transport response: "meta" must be an object.',
      }),
    });
  });

  it("rejects whitespace-only report backend identities", async () => {
    const form = createNameForm(
      vi.fn().mockResolvedValue({
        reports: [{ backend: "  ", mappedTo: "score", status: "ready", payload: 1 }],
      }),
    );

    await expect(form.submit()).rejects.toMatchObject({
      name: "SubmitError",
      cause: expect.objectContaining({
        message: expect.stringContaining('"backend" must be a non-empty string'),
      }),
    });
  });

  it("normalizes abort while afterSubmit is pending", async () => {
    let release = (): void => {};
    let started = (): void => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const hookStarted = new Promise<void>((resolve) => {
      started = resolve;
    });
    const form = createNameForm(vi.fn().mockResolvedValue({ reports: [] }), {
      hooks: {
        async afterSubmit() {
          started();
          await gate;
        },
      },
    });
    form.setValues({ name: "Ada" });

    const submission = form.submit();
    await hookStarted;
    form.abortSubmit("cancelled-after-transport");
    release();

    await expect(submission).rejects.toBeInstanceOf(SubmissionAbortedError);
    expect(form.state.status).toBe("idle");
    expect(form.state.errors.form).toEqual([
      "Form submission was aborted: cancelled-after-transport",
    ]);
  });

  it("rejects duplicate backend identities before submitting", async () => {
    const submit = vi.fn().mockResolvedValue({ reports: [] });
    const form = createNameForm(submit);

    await expect(executeMultiBackendPipeline({ form, backends: ["risk", "risk"] })).rejects.toThrow(
      'Duplicate backend "risk"',
    );
    expect(submit).not.toHaveBeenCalled();
  });

  it("validates backend identities across submission and snapshot entry points", async () => {
    const submit = vi.fn().mockResolvedValue({ reports: [] });
    const form = createNameForm(submit);

    await expect(form.submit({ backend: " " })).rejects.toBeInstanceOf(EngineError);
    expect(() => createSubmissionSnapshot(form, { backend: "" })).toThrow(EngineError);
    expect(() =>
      createMultiBackendSubmissionSnapshot(form, { backends: ["risk", "risk"] }),
    ).toThrow('Duplicate backend "risk"');
    expect(submit).not.toHaveBeenCalled();

    await expect(form.submit({ backend: "risk" })).resolves.toBeDefined();
  });

  it("stops multi-backend orchestration after cancellation", async () => {
    const controller = new AbortController();
    let started = (): void => {};
    const firstStarted = new Promise<void>((resolve) => {
      started = resolve;
    });
    const submit = vi.fn(
      ({ backend }: SubmitRequest) =>
        new Promise((resolve) => {
          if (backend === "risk") started();
          else resolve({ reports: [] });
        }),
    );
    const form = createNameForm(submit);

    const pipeline = executeMultiBackendPipeline({
      form,
      backends: [{ backend: "risk", signal: controller.signal }, "cost"],
    });
    await firstStarted;
    controller.abort("stop-all-backends");

    await expect(pipeline).rejects.toBeInstanceOf(SubmissionAbortedError);
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("cancels the form pipeline when report fetching is aborted", async () => {
    const controller = new AbortController();
    let started = (): void => {};
    const fetchStarted = new Promise<void>((resolve) => {
      started = resolve;
    });
    const pack = createBuiltinTestKit();
    pack.registry.registerReport({
      kind: "remote",
      schema: z.object({
        kind: z.literal("remote"),
        id: z.string().optional(),
      }),
      fetch: () => ({
        submit: () =>
          new Promise(() => {
            started();
          }),
      }),
    });
    const form = createForm({
      schema: { fields: [], reports: [{ kind: "remote", id: "remote" }] },
      registry: pack.registry,
      transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
    });

    const pipeline = executeFormPipeline({ form, submit: { signal: controller.signal } });
    await fetchStarted;
    controller.abort("stop-report-fetches");

    await expect(pipeline).rejects.toBeInstanceOf(SubmissionAbortedError);
    expect(form.getReport("remote")?.state.status).toBe("idle");
  });

  it("rejects missing identities received by multi-backend JavaScript callers", () => {
    const form = createNameForm(vi.fn().mockResolvedValue({ reports: [] }));

    expect(() =>
      createMultiBackendSubmissionSnapshot(form, {
        backends: [undefined] as unknown as string[],
      }),
    ).toThrow("Backend identities must be non-empty strings.");
  });

  it("aborts sibling fanout targets on fail-fast failure", async () => {
    let siblingAborted = (): void => {};
    const observedAbort = new Promise<void>((resolve) => {
      siblingAborted = resolve;
    });
    const transport = createFanoutTransport({
      targets: ["broken", "slow"],
      failurePolicy: "fail-fast",
      submit: async (target, request) => {
        if (target === "broken") throw new Error("offline");
        return new Promise((_resolve, reject) => {
          request.signal?.addEventListener(
            "abort",
            () => {
              siblingAborted();
              reject(request.signal?.reason);
            },
            { once: true },
          );
        });
      },
      merge: () => null,
    });

    await expect(
      transport.submit({ inputs: [], displayValues: {}, modelValues: {}, fields: [], reports: [] }),
    ).rejects.toThrow("offline");
    await observedAbort;
  });

  it("does not wait for a non-cooperative fanout target after external cancellation", async () => {
    const controller = new AbortController();
    let started = (): void => {};
    const targetStarted = new Promise<void>((resolve) => {
      started = resolve;
    });
    const merge = vi.fn();
    const transport = createFanoutTransport({
      targets: ["remote"],
      submit: () =>
        new Promise(() => {
          started();
        }),
      merge,
    });
    const pending = transport.submit({
      inputs: [],
      displayValues: {},
      modelValues: {},
      fields: [],
      reports: [],
      signal: controller.signal,
    });
    await targetStarted;
    controller.abort("cancel-fanout");

    await expect(pending).rejects.toBeDefined();
    expect(merge).not.toHaveBeenCalled();
  });
});
