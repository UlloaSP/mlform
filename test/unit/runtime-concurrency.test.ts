import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import { createForm, type FormHooks, type RuntimeBehavior } from "@/runtime";
import { createRegistry } from "@/schema";

const deferred = () => {
  let resolve = (): void => {};
  const promise = new Promise<void>((next) => {
    resolve = next;
  });
  return { promise, resolve };
};

const createBehaviorForm = (
  behavior: RuntimeBehavior,
  submit = vi.fn().mockResolvedValue({}),
  hooks?: FormHooks,
) => {
  const registry = createRegistry().registerField({
    kind: "value",
    schema: z
      .object({
        id: z.string().optional(),
        kind: z.literal("value"),
        label: z.string(),
        mappedTo: z.string().optional(),
        defaultValue: z.unknown().optional(),
      })
      .passthrough(),
    getDefaultValue: (config) => config.defaultValue ?? null,
  });

  return createForm({
    schema: {
      fields: [
        { id: "source", kind: "value", label: "Source", defaultValue: 0 },
        {
          id: "derived",
          kind: "value",
          label: "Derived",
          mappedTo: "derived",
          defaultValue: "initial",
        },
      ],
    },
    registry,
    behaviors: [behavior],
    hooks,
    transport: { submit },
  });
};

describe("runtime concurrency", () => {
  it("waits for pending derived behavior before explicit validation", async () => {
    const gate = deferred();
    const beforeValidate = vi.fn();
    const form = createBehaviorForm(
      {
        async onValuesChanged(event, context) {
          if (event.fieldId !== "source") return;
          await gate.promise;
          context.commitDerivedValue("derived", `derived-${String(event.values.source)}`);
        },
      },
      undefined,
      { beforeValidate },
    );

    form.setValues({ source: 2 });
    const validation = form.validate();

    await Promise.resolve();
    expect(beforeValidate).not.toHaveBeenCalled();

    gate.resolve();
    await expect(validation).resolves.toMatchObject({ valid: true });
    expect(beforeValidate).toHaveBeenCalledOnce();
    expect(form.getValues().derived).toBe("derived-2");
  });

  it("submits the stable values produced by pending derived behavior", async () => {
    const gate = deferred();
    const submit = vi.fn().mockResolvedValue({});
    const form = createBehaviorForm(
      {
        async onValuesChanged(event, context) {
          if (event.fieldId !== "source") return;
          await gate.promise;
          context.commitDerivedValue("derived", `derived-${String(event.values.source)}`);
        },
      },
      submit,
    );

    form.setValues({ source: 3 });
    const submission = form.submit();
    await Promise.resolve();
    expect(submit).not.toHaveBeenCalled();

    gate.resolve();
    await submission;

    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ modelValues: { derived: "derived-3" } }),
    );
  });

  it("keeps one behavior generation for every field in a setValues transaction", async () => {
    const gate = deferred();
    const form = createBehaviorForm({
      async onValuesChanged(event, context) {
        if (event.fieldId !== "source") return;
        await gate.promise;
        context.commitDerivedValue("derived", `derived-${String(event.values.source)}`);
      },
    });

    form.setValues({ source: 4, derived: "manual" });
    const validation = form.validate();
    gate.resolve();

    await validation;
    expect(form.getValues().derived).toBe("derived-4");
  });

  it("rejects explicit validation while a submission is active", async () => {
    const gate = deferred();
    const form = createBehaviorForm(
      {},
      vi.fn(async () => {
        await gate.promise;
        return {};
      }),
    );
    const submission = form.submit();
    await vi.waitFor(() => expect(form.state.status).toBe("submitting"));

    await expect(form.validate()).rejects.toThrow("submission is in progress");

    gate.resolve();
    await expect(submission).resolves.toMatchObject({ modelValues: { derived: "initial" } });
  });

  it("rejects submission while explicit validation is active", async () => {
    const gate = deferred();
    const submit = vi.fn().mockResolvedValue({});
    const form = createBehaviorForm({}, submit, {
      async beforeValidate() {
        await gate.promise;
      },
    });
    const validation = form.validate();
    await vi.waitFor(() => expect(form.state.status).toBe("validating"));

    await expect(form.submit()).rejects.toThrow("explicit form validation is in progress");
    expect(submit).not.toHaveBeenCalled();

    gate.resolve();
    await validation;
  });

  it("does not restart validation after reset aborts a pending behavior", async () => {
    const gate = deferred();
    const beforeValidate = vi.fn();
    const form = createBehaviorForm(
      {
        async onValuesChanged(event) {
          if (event.fieldId === "source") await gate.promise;
        },
      },
      undefined,
      { beforeValidate },
    );

    form.setValues({ source: 5 });
    const validation = form.validate();
    form.reset();

    await expect(validation).resolves.toMatchObject({ valid: true });
    expect(beforeValidate).not.toHaveBeenCalled();

    gate.resolve();
  });

  it("aborts submission when values change while it waits for stable behavior values", async () => {
    const gate = deferred();
    const submit = vi.fn().mockResolvedValue({});
    const form = createBehaviorForm(
      {
        async onValuesChanged(event) {
          if (event.fieldId === "source") await gate.promise;
        },
      },
      submit,
    );

    form.setValues({ source: 6 });
    const submission = form.submit();
    form.setValues({ source: 7 });
    gate.resolve();

    await expect(submission).rejects.toThrow("form state changed during submission validation");
    expect(submit).not.toHaveBeenCalled();
  });

  it("aborts submission immediately while it waits for a pending behavior", async () => {
    const gate = deferred();
    const submit = vi.fn().mockResolvedValue({});
    const beforeValidate = vi.fn();
    const form = createBehaviorForm(
      {
        async onValuesChanged(event) {
          if (event.fieldId === "source") await gate.promise;
        },
      },
      submit,
      { beforeValidate },
    );

    form.setValues({ source: 8 });
    const submission = form.submit();
    form.abortSubmit("cancelled while deriving");

    await expect(submission).rejects.toThrow("cancelled while deriving");
    expect(submit).not.toHaveBeenCalled();

    gate.resolve();
    await Promise.resolve();
    expect(beforeValidate).not.toHaveBeenCalled();
  });
});
