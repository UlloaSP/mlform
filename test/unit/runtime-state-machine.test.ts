import { describe, expect, it } from "vitest";
import { createInitialEngineState, transitionEngineState } from "@/runtime/state";

describe("runtime state machine", () => {
  it("tracks work and submission outcome on independent axes", () => {
    const validating = transitionEngineState(createInitialEngineState(), {
      type: "start-validation",
      validationVersion: 1,
    });
    const resting = transitionEngineState(validating, { type: "rest" });
    const submitting = transitionEngineState(resting, {
      type: "start-submission",
      submissionVersion: 1,
    });
    const result = {
      inputs: [],
      displayValues: {},
      modelValues: {},
      reports: [],
      reportContexts: {},
      reportStates: {},
      meta: {},
      raw: null,
    };
    const succeeded = transitionEngineState(submitting, {
      type: "submission-success",
      result,
    });
    const edited = transitionEngineState(succeeded, { type: "editing" });

    expect(edited).toMatchObject({
      lifecycle: "active",
      operation: "idle",
      submissionStatus: "succeeded",
      lastResult: result,
    });
    expect(edited.lastTransition?.type).toBe("submission-succeeded");
    expect(edited.transitionSequence).toBe(4);
  });

  it("rejects transitions that do not belong to the current state", () => {
    const initial = createInitialEngineState();

    expect(() =>
      transitionEngineState(initial, {
        type: "submission-success",
        result: {} as never,
      }),
    ).toThrow('Invalid engine transition "submission-success"');
  });

  it("makes disposal terminal", () => {
    const disposed = transitionEngineState(createInitialEngineState(), { type: "dispose" });

    expect(disposed).toMatchObject({ lifecycle: "disposed", operation: "idle" });
    expect(() => transitionEngineState(disposed, { type: "editing" })).toThrow(
      'from lifecycle "disposed"',
    );
  });

  it("models suspension as a resumable state and keeps disposal terminal", () => {
    const suspended = transitionEngineState(createInitialEngineState(), {
      type: "suspend",
      message: "host-hidden",
    });

    expect(suspended).toMatchObject({ lifecycle: "suspended", operation: "idle" });
    expect(suspended.lastTransition).toMatchObject({
      type: "suspended",
      reason: "host-hidden",
    });
    expect(() => transitionEngineState(suspended, { type: "editing" })).toThrow(
      'from lifecycle "suspended"',
    );

    const resumed = transitionEngineState(suspended, { type: "resume" });
    expect(resumed.lifecycle).toBe("active");
    expect(resumed.lastTransition?.type).toBe("resumed");

    const disposed = transitionEngineState(suspended, { type: "dispose" });
    expect(disposed.lifecycle).toBe("disposed");
    expect(() => transitionEngineState(disposed, { type: "resume" })).toThrow(
      'from lifecycle "disposed"',
    );
  });
});
