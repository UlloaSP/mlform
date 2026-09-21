import { describe, expect, it, vi } from "vitest";
import { createForm, type FormTransition } from "@/runtime";
import { createBuiltinTestKit } from "../helpers/builtin-test-kit";

const createTextForm = (submit = vi.fn().mockResolvedValue({})) =>
  createForm({
    schema: { fields: [{ kind: "text", id: "name", label: "Name", mappedTo: "name" }] },
    registry: createBuiltinTestKit().registry,
    transport: { submit },
  });

describe("runtime transitions", () => {
  it("emits ordered lifecycle transitions without field values", async () => {
    const form = createTextForm();
    const transitions: FormTransition[] = [];
    form.subscribeTransitions((transition) => transitions.push(transition));

    form.setValues({ name: "Ada" });
    await form.submit();

    expect(transitions.map(({ sequence, type }) => ({ sequence, type }))).toEqual([
      { sequence: 1, type: "validation-started" },
      { sequence: 2, type: "validation-finished" },
      { sequence: 3, type: "submission-started" },
      { sequence: 4, type: "submission-succeeded" },
    ]);
    expect(transitions[0]).toMatchObject({
      from: { operation: "idle", submissionStatus: "idle", submitCount: 0 },
      to: { operation: "validating", submissionStatus: "idle", submitCount: 0 },
    });
    expect(transitions[3]).toMatchObject({
      from: { operation: "submitting", submissionStatus: "idle", submitCount: 1 },
      to: { operation: "idle", submissionStatus: "succeeded", submitCount: 1 },
    });
    expect(JSON.stringify(transitions)).not.toContain("Ada");
    expect(Object.isFrozen(transitions[0])).toBe(true);
    expect(Object.isFrozen(transitions[0]?.from)).toBe(true);
  });

  it("includes failure and abort reasons", async () => {
    const validation = createForm({
      schema: { fields: [] },
      registry: createBuiltinTestKit().registry,
      transport: { submit: vi.fn() },
      hooks: { beforeValidate: () => Promise.reject(new Error("validation unavailable")) },
    });
    const validationTransitions: FormTransition[] = [];
    validation.subscribeTransitions((transition) => validationTransitions.push(transition));
    await expect(validation.validate()).rejects.toThrow("validation unavailable");
    expect(validationTransitions.at(-1)).toMatchObject({
      type: "validation-failed",
      reason: "validation unavailable",
    });

    const failed = createTextForm(vi.fn().mockRejectedValue(new Error("backend offline")));
    const failedTransitions: FormTransition[] = [];
    failed.subscribeTransitions((transition) => failedTransitions.push(transition));
    failed.setValues({ name: "Ada" });

    await expect(failed.submit()).rejects.toThrow("backend offline");
    expect(failedTransitions.at(-1)).toMatchObject({
      type: "submission-failed",
      reason: "backend offline",
    });

    const pendingTransport = Promise.withResolvers<unknown>();
    const aborted = createTextForm(vi.fn(() => pendingTransport.promise));
    const abortedTransitions: FormTransition[] = [];
    aborted.subscribeTransitions((transition) => abortedTransitions.push(transition));
    const pending = aborted.submit();
    await vi.waitFor(() => expect(aborted.state.operation).toBe("submitting"));
    aborted.abortSubmit("user-cancelled");

    await expect(pending).rejects.toMatchObject({ name: "SubmissionAbortedError" });
    expect(abortedTransitions.at(-1)).toMatchObject({
      type: "submission-aborted",
      reason: "Form submission was aborted: user-cancelled",
    });
    pendingTransport.resolve({});
  });

  it("emits reset, restoration, and disposal without replaying earlier events", () => {
    const form = createTextForm();
    const snapshot = form.createSnapshot();
    form.setValues({ name: "ignored transition" });
    const transitions: FormTransition[] = [];
    form.subscribeTransitions((transition) => transitions.push(transition));

    form.reset();
    form.restoreSnapshot(snapshot);
    form.dispose();

    expect(transitions.map((transition) => transition.type)).toEqual([
      "reset",
      "restored",
      "disposed",
    ]);
    expect(transitions.map((transition) => transition.sequence)).toEqual([1, 2, 3]);
    expect(transitions.at(-1)?.to.lifecycle).toBe("disposed");
  });

  it("emits idempotent suspend and resume transitions", () => {
    const form = createTextForm();
    const transitions: FormTransition[] = [];
    form.subscribeTransitions((transition) => transitions.push(transition));

    form.suspend("host-hidden");
    form.suspend("duplicate");
    form.resume();
    form.resume();

    expect(transitions).toMatchObject([
      { sequence: 1, type: "suspended", reason: "host-hidden" },
      { sequence: 2, type: "resumed" },
    ]);
  });

  it("preserves transition order when a state listener causes a nested transition", async () => {
    const form = createTextForm();
    const transitions: FormTransition[] = [];
    let reset = false;
    form.subscribe((state) => {
      if (state.operation === "validating" && !reset) {
        reset = true;
        form.reset();
      }
    });
    form.subscribeTransitions((transition) => transitions.push(transition));

    await form.validate();

    expect(transitions.map(({ sequence, type }) => ({ sequence, type }))).toEqual([
      { sequence: 1, type: "validation-started" },
      { sequence: 2, type: "reset" },
    ]);
  });
});
