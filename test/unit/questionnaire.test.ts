// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import {
  createBuiltinRegistry,
  createForm,
  longTextFieldDefinition,
  multiChoiceFieldDefinition,
  ratingFieldDefinition,
  singleChoiceFieldDefinition,
} from "@/engine";
import { QuestionnaireController } from "@/questionnaire/engine/controller";
import {
  createQuestionnaireSchema,
  normalizeQuestionnaireSchema,
} from "@/questionnaire/engine/schema";
import { QuestionnaireError } from "@/questionnaire/errors";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeTransport = () => ({ submit: vi.fn().mockResolvedValue({}) });

const makeForm = (fieldIds: string[]) => {
  return createForm({
    schema: {
      fields: fieldIds.map((id) => ({ kind: "text", label: id, id })),
    },
    registry: createBuiltinRegistry(),
    transport: makeTransport(),
  });
};

const makeSteps = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `step-${i + 1}`,
    title: `Step ${i + 1}`,
    fieldIds: [`step-${i + 1}-field`],
  }));

// ── New field definitions ────────────────────────────────────────────────────

describe("new builtin field definitions", () => {
  describe("long-text", () => {
    it("kind is long-text", () => {
      expect(longTextFieldDefinition.kind).toBe("long-text");
    });

    it("getDefaultValue returns empty string", () => {
      const config = { kind: "long-text" as const, label: "Bio", rows: 4 };
      expect(longTextFieldDefinition.getDefaultValue!(config)).toBe("");
    });

    it("normalizeValue coerces to string", () => {
      expect(longTextFieldDefinition.normalizeValue!(42, {} as never)).toBe("42");
      expect(longTextFieldDefinition.normalizeValue!(null, {} as never)).toBe("");
    });

    it("validates minLength", () => {
      const config = { kind: "long-text" as const, label: "Bio", minLength: 10 };
      const errors = longTextFieldDefinition.validate!(
        "hi",
        config as never,
        {} as never,
      ) as string[];
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain("10");
    });

    it("validates maxLength", () => {
      const config = { kind: "long-text" as const, label: "Bio", maxLength: 3 };
      const errors = longTextFieldDefinition.validate!("hello", config as never, {} as never);
      expect(errors).toHaveLength(1);
    });

    it("passes empty value without errors", () => {
      const config = { kind: "long-text" as const, label: "Bio", minLength: 5 };
      const errors = longTextFieldDefinition.validate!("", config as never, {} as never);
      expect(errors).toHaveLength(0);
    });
  });

  describe("single-choice", () => {
    it("kind is single-choice", () => {
      expect(singleChoiceFieldDefinition.kind).toBe("single-choice");
    });

    it("getDefaultValue returns null", () => {
      const config = { kind: "single-choice" as const, label: "Q", options: ["a", "b"] };
      expect(singleChoiceFieldDefinition.getDefaultValue!(config as never)).toBeNull();
    });

    it("normalizeValue returns null for empty", () => {
      expect(singleChoiceFieldDefinition.normalizeValue!("", {} as never)).toBeNull();
      expect(singleChoiceFieldDefinition.normalizeValue!(null, {} as never)).toBeNull();
    });

    it("validate passes for value in options", () => {
      const config = { kind: "single-choice" as const, label: "Q", options: ["a", "b"] };
      expect(singleChoiceFieldDefinition.validate!("a", config as never, {} as never)).toHaveLength(
        0,
      );
    });

    it("validate fails for value not in options", () => {
      const config = { kind: "single-choice" as const, label: "Q", options: ["a", "b"] };
      expect(singleChoiceFieldDefinition.validate!("c", config as never, {} as never)).toHaveLength(
        1,
      );
    });

    it("validate passes for null", () => {
      const config = { kind: "single-choice" as const, label: "Q", options: ["a", "b"] };
      expect(
        singleChoiceFieldDefinition.validate!(null, config as never, {} as never),
      ).toHaveLength(0);
    });
  });

  describe("multi-choice", () => {
    it("kind is multi-choice", () => {
      expect(multiChoiceFieldDefinition.kind).toBe("multi-choice");
    });

    it("getDefaultValue returns empty array", () => {
      const config = { kind: "multi-choice" as const, label: "Q", options: ["a", "b"] };
      expect(multiChoiceFieldDefinition.getDefaultValue!(config as never)).toEqual([]);
    });

    it("normalizeValue coerces non-array to empty array", () => {
      expect(multiChoiceFieldDefinition.normalizeValue!(null, {} as never)).toEqual([]);
      expect(multiChoiceFieldDefinition.normalizeValue!("a", {} as never)).toEqual([]);
    });

    it("normalizeValue preserves string arrays", () => {
      expect(multiChoiceFieldDefinition.normalizeValue!(["a", "b"], {} as never)).toEqual([
        "a",
        "b",
      ]);
    });

    it("validate passes for valid values", () => {
      const config = { kind: "multi-choice" as const, label: "Q", options: ["a", "b"] };
      expect(
        multiChoiceFieldDefinition.validate!(["a", "b"], config as never, {} as never),
      ).toHaveLength(0);
    });

    it("validate fails for invalid values", () => {
      const config = { kind: "multi-choice" as const, label: "Q", options: ["a", "b"] };
      expect(
        multiChoiceFieldDefinition.validate!(["a", "c"], config as never, {} as never),
      ).toHaveLength(1);
    });

    it("validate passes for empty selection", () => {
      const config = { kind: "multi-choice" as const, label: "Q", options: ["a", "b"] };
      expect(multiChoiceFieldDefinition.validate!([], config as never, {} as never)).toHaveLength(
        0,
      );
    });
  });

  describe("rating", () => {
    it("kind is rating", () => {
      expect(ratingFieldDefinition.kind).toBe("rating");
    });

    it("getDefaultValue returns null", () => {
      const config = { kind: "rating" as const, label: "Q", max: 5 };
      expect(ratingFieldDefinition.getDefaultValue!(config as never)).toBeNull();
    });

    it("validate passes for null", () => {
      const config = { kind: "rating" as const, label: "Q", max: 5 };
      expect(ratingFieldDefinition.validate!(null, config as never, {} as never)).toHaveLength(0);
    });

    it("validate passes for valid rating", () => {
      const config = { kind: "rating" as const, label: "Q", max: 5 };
      expect(ratingFieldDefinition.validate!(3, config as never, {} as never)).toHaveLength(0);
    });

    it("validate fails below min", () => {
      const config = { kind: "rating" as const, label: "Q", min: 1, max: 5 };
      expect(ratingFieldDefinition.validate!(0, config as never, {} as never)).toHaveLength(1);
    });

    it("validate fails above max", () => {
      const config = { kind: "rating" as const, label: "Q", max: 5 };
      expect(ratingFieldDefinition.validate!(6, config as never, {} as never)).toHaveLength(1);
    });
  });

  describe("createBuiltinRegistry includes new kinds", () => {
    it("registers all 4 new field types", () => {
      const registry = createBuiltinRegistry();
      expect(registry.getField("long-text")).toBeDefined();
      expect(registry.getField("single-choice")).toBeDefined();
      expect(registry.getField("multi-choice")).toBeDefined();
      expect(registry.getField("rating")).toBeDefined();
    });
  });
});

// ── normalizeQuestionnaireSchema ─────────────────────────────────────────────

describe("normalizeQuestionnaireSchema", () => {
  const registry = createBuiltinRegistry();

  it("throws on empty steps array", () => {
    expect(() => normalizeQuestionnaireSchema({ steps: [] }, registry)).toThrow(QuestionnaireError);
  });

  it("throws on step with no fields", () => {
    expect(() =>
      normalizeQuestionnaireSchema({ steps: [{ title: "Step 1", fields: [] }] }, registry),
    ).toThrow(QuestionnaireError);
  });

  it("assigns step ids from title slugs", () => {
    const result = normalizeQuestionnaireSchema(
      {
        steps: [{ title: "Personal Info", fields: [{ kind: "text", label: "Name" }] }],
      },
      registry,
    );
    expect(result.steps[0]?.id).toBe("personal-info");
  });

  it("uses explicit step id when provided", () => {
    const result = normalizeQuestionnaireSchema(
      {
        steps: [{ id: "my-step", title: "Step 1", fields: [{ kind: "text", label: "Name" }] }],
      },
      registry,
    );
    expect(result.steps[0]?.id).toBe("my-step");
  });

  it("throws on duplicate explicit step ids", () => {
    expect(() =>
      normalizeQuestionnaireSchema(
        {
          steps: [
            { id: "same", title: "Step 1", fields: [{ kind: "text", label: "A" }] },
            { id: "same", title: "Step 2", fields: [{ kind: "text", label: "B" }] },
          ],
        },
        registry,
      ),
    ).toThrow(QuestionnaireError);
  });

  it("flattens all step fields into formSchema.fields", () => {
    const result = normalizeQuestionnaireSchema(
      {
        steps: [
          {
            title: "Step 1",
            fields: [
              { kind: "text", label: "First Name" },
              { kind: "text", label: "Last Name" },
            ],
          },
          {
            title: "Step 2",
            fields: [{ kind: "number", label: "Age" }],
          },
        ],
      },
      registry,
    );

    expect(result.formSchema.fields).toHaveLength(3);
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0]?.fieldIds).toHaveLength(2);
    expect(result.steps[1]?.fieldIds).toHaveLength(1);
  });

  it("stores description on normalized step", () => {
    const result = normalizeQuestionnaireSchema(
      {
        steps: [
          {
            title: "Preferences",
            description: "Tell us what you like.",
            fields: [{ kind: "text", label: "Fav color" }],
          },
        ],
      },
      registry,
    );
    expect(result.steps[0]?.description).toBe("Tell us what you like.");
  });

  it("createQuestionnaireSchema is identity helper", () => {
    const schema = createQuestionnaireSchema({ steps: [] });
    expect(schema.steps).toEqual([]);
  });
});

// ── QuestionnaireController ──────────────────────────────────────────────────

describe("QuestionnaireController", () => {
  const makeController = (stepCount: number) => {
    const steps = makeSteps(stepCount);
    const form = makeForm(steps.flatMap((s) => s.fieldIds));
    return new QuestionnaireController(form, steps);
  };

  describe("state", () => {
    it("starts at step 0 with correct progress", () => {
      const ctrl = makeController(3);
      const state = ctrl.state;
      expect(state.stepIndex).toBe(0);
      expect(state.stepProgress).toEqual({ current: 1, total: 3 });
      expect(state.canGoPrev).toBe(false);
      expect(state.canGoNext).toBe(true);
      expect(state.isLastStep).toBe(false);
    });

    it("isLastStep true on single-step questionnaire", () => {
      const ctrl = makeController(1);
      expect(ctrl.state.isLastStep).toBe(true);
      expect(ctrl.state.canGoPrev).toBe(false);
      expect(ctrl.state.canGoNext).toBe(false);
    });

    it("exposes form controller", () => {
      const ctrl = makeController(2);
      expect(ctrl.form).toBeDefined();
      expect(typeof ctrl.form.submit).toBe("function");
    });

    it("exposes steps", () => {
      const ctrl = makeController(3);
      expect(ctrl.steps).toHaveLength(3);
      expect(ctrl.steps[0]?.id).toBe("step-1");
    });
  });

  describe("prev()", () => {
    it("does not go below step 0", () => {
      const ctrl = makeController(2);
      ctrl.prev();
      expect(ctrl.state.stepIndex).toBe(0);
    });

    it("decrements step index", async () => {
      const ctrl = makeController(3);
      await ctrl.next(); // move to step 1
      ctrl.prev();
      expect(ctrl.state.stepIndex).toBe(0);
    });

    it("notifies subscribers on prev", async () => {
      const ctrl = makeController(3);
      await ctrl.next();
      const listener = vi.fn();
      ctrl.subscribe(listener);
      ctrl.prev();
      expect(listener).toHaveBeenCalledOnce();
    });
  });

  describe("next()", () => {
    it("advances step when current step fields are valid", async () => {
      const ctrl = makeController(2);
      const advanced = await ctrl.next();
      expect(advanced).toBe(true);
      expect(ctrl.state.stepIndex).toBe(1);
    });

    it("does not advance past last step", async () => {
      const ctrl = makeController(1);
      // On last step, next() validates but does not advance
      const advanced = await ctrl.next();
      expect(advanced).toBe(true);
      expect(ctrl.state.stepIndex).toBe(0); // still at 0, last step
    });

    it("returns false when a required field is empty", async () => {
      const steps = makeSteps(2);
      // Override first step with a required field
      steps[0] = {
        id: "step-1",
        title: "Step 1",
        fieldIds: ["required-field"],
      };
      const form = createForm({
        schema: {
          fields: [
            { kind: "text", label: "required-field", id: "required-field", required: true },
            { kind: "text", label: "step-2-field", id: "step-2-field" },
          ],
        },
        registry: createBuiltinRegistry(),
        transport: makeTransport(),
      });
      const ctrl = new QuestionnaireController(form, steps);
      const advanced = await ctrl.next();
      expect(advanced).toBe(false);
      expect(ctrl.state.stepIndex).toBe(0);
    });

    it("notifies subscribers on step advance", async () => {
      const ctrl = makeController(3);
      const listener = vi.fn();
      ctrl.subscribe(listener);
      await ctrl.next();
      expect(listener).toHaveBeenCalledOnce();
      expect(listener.mock.calls[0]?.[0]?.stepIndex).toBe(1);
    });
  });

  describe("subscribe()", () => {
    it("returns an unsubscribe function", () => {
      const ctrl = makeController(2);
      const listener = vi.fn();
      const unsub = ctrl.subscribe(listener);
      unsub();
      ctrl.prev(); // should not call listener
      expect(listener).not.toHaveBeenCalled();
    });

    it("fires listener on both next and prev", async () => {
      const ctrl = makeController(3);
      const listener = vi.fn();
      ctrl.subscribe(listener);
      await ctrl.next();
      await ctrl.next();
      ctrl.prev();
      expect(listener).toHaveBeenCalledTimes(3);
    });
  });
});
