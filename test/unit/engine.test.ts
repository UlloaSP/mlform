// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import {
  EngineError,
  SubmissionAbortedError,
  SubmitError,
  ValidationError,
  createBuiltinRegistry,
  createForm,
  shallowEquality,
} from "@/engine";

describe("engine", () => {
  it("creates a headless form with normalized ids and descriptors", () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "Customer Name",
            placeholder: "Type here",
          },
          {
            kind: "number",
            label: "Age",
            min: 18,
          },
        ],
        reports: [
          {
            kind: "classifier",
            label: "Prediction",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    expect(form.fields).toHaveLength(2);
    expect(form.reports).toHaveLength(1);
    expect(form.fields[0]?.id).toBe("customer-name");
    expect(form.fields[1]?.id).toBe("age");
    expect(form.reports[0]?.id).toBe("prediction");
    expect(form.fields[0]?.descriptor).toEqual({
      component: "text-field",
      props: expect.objectContaining({
        id: "customer-name",
        label: "Customer Name",
        placeholder: "Type here",
        value: "",
      }),
    });
    expect(form.state.valid).toBe(true);
  });

  it("updates values, emits subscriptions, and validates built-in constraints", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
            required: true,
            minLength: 3,
          },
          {
            kind: "number",
            label: "Age",
            min: 18,
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    const listener = vi.fn();
    const unsubscribe = form.subscribe(listener);

    form.setValues({
      name: "Al",
      age: 15,
    });

    expect(form.getValues()).toEqual({
      name: "Al",
      age: 15,
    });
    expect(form.state.status).toBe("editing");
    expect(listener).toHaveBeenCalled();

    const validation = await form.validate();

    expect(validation.valid).toBe(false);
    expect(validation.fields.name).toEqual(["Minimum length is 3 characters."]);
    expect(validation.fields.age).toEqual(["Minimum value is 18."]);

    unsubscribe();
  });

  it("supports selector subscriptions and field-level subscriptions", () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    const formSelectorListener = vi.fn();
    const fieldListener = vi.fn();

    const unsubscribeSelected = form.subscribeSelector(
      (state) => state.values.name,
      formSelectorListener,
      { emitInitial: true },
    );
    const unsubscribeField = form.fields[0]!.subscribe(fieldListener);

    form.setValues({ name: "Alice" });
    form.setValues({ name: "Alice" });
    form.setValues({ name: "Bob" });

    expect(formSelectorListener).toHaveBeenCalledTimes(3);
    expect(formSelectorListener).toHaveBeenNthCalledWith(1, "", expect.any(Object));
    expect(formSelectorListener).toHaveBeenNthCalledWith(2, "Alice", expect.any(Object));
    expect(formSelectorListener).toHaveBeenNthCalledWith(3, "Bob", expect.any(Object));
    expect(fieldListener).toHaveBeenCalled();

    unsubscribeSelected();
    unsubscribeField();
  });

  it("supports shallow selector equality helpers for object selections", () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    const listener = vi.fn();
    const unsubscribe = form.subscribeSelector(
      (state) => ({
        name: state.values.name,
      }),
      listener,
      {
        emitInitial: true,
        equality: shallowEquality,
      },
    );

    form.setValues({ name: "Alice" });
    form.setValues({ name: "Alice" });
    form.setValues({ name: "Bob" });

    expect(listener).toHaveBeenCalledTimes(3);

    unsubscribe();
  });

  it("uses shallow equality by default for object selector results", () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    const listener = vi.fn();
    const unsubscribe = form.subscribeSelector(
      (state) => ({
        name: state.values.name,
      }),
      listener,
      { emitInitial: true },
    );

    form.setValues({ name: "Alice" });
    form.setValues({ name: "Alice" });
    form.setValues({ name: "Bob" });

    expect(listener).toHaveBeenCalledTimes(3);

    unsubscribe();
  });

  it("applies conditional visibility, disablement, and read-only rules", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "boolean",
            label: "Advanced",
          },
          {
            kind: "text",
            label: "Secret",
            hiddenWhen: ({ values }) => values.advanced !== true,
            disabledWhen: ({ values }) => values.advanced !== true,
          },
          {
            kind: "text",
            label: "Locked",
            readOnlyWhen: ({ values }) => values.advanced === true,
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    expect(form.getField("secret")?.state.visible).toBe(false);
    expect(form.getField("secret")?.state.disabled).toBe(true);

    expect(() => {
      form.setValues({ secret: "x" });
    }).toThrow(EngineError);

    form.setValues({ advanced: true });

    expect(form.getField("secret")?.state.visible).toBe(true);
    expect(form.getField("secret")?.state.disabled).toBe(false);
    expect(form.getField("locked")?.state.readOnly).toBe(true);

    expect(() => {
      form.setValues({ locked: "forbidden" });
    }).toThrow(EngineError);

    form.setValues({ secret: "revealed" });
    await form.validate();

    expect(form.getValues().secret).toBe("revealed");
    expect(form.getField("secret")?.state.valid).toBe(true);
  });

  it("supports declarative field conditions", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "boolean",
            label: "Advanced",
          },
          {
            kind: "text",
            label: "Secret",
            hiddenWhen: {
              kind: "field-value",
              field: "advanced",
              notEquals: true,
            },
            disabledWhen: {
              kind: "field-value",
              field: "advanced",
              notEquals: true,
            },
          },
          {
            kind: "text",
            label: "Locked",
            readOnlyWhen: {
              kind: "all",
              conditions: [
                {
                  kind: "field-value",
                  field: "advanced",
                  equals: true,
                },
                {
                  kind: "form-status",
                  equals: ["editing", "success"],
                },
              ],
            },
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn().mockResolvedValue({ reports: {} }),
      },
    });

    expect(form.getField("secret")?.state.visible).toBe(false);
    expect(form.getField("secret")?.state.disabled).toBe(true);

    form.setValues({ advanced: true });

    expect(form.getField("secret")?.state.visible).toBe(true);
    expect(form.getField("secret")?.state.disabled).toBe(false);
    expect(form.getField("locked")?.state.readOnly).toBe(true);

    form.setValues({ secret: "visible" });
    await form.submit();

    expect(form.state.status).toBe("success");
    expect(form.getField("locked")?.state.readOnly).toBe(true);
  });

  it("supports declarative comparison conditions against literals and other fields", () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "number",
            label: "Minimum",
          },
          {
            kind: "number",
            label: "Maximum",
          },
          {
            kind: "text",
            label: "Summary",
            hiddenWhen: {
              kind: "field-value",
              field: "minimum",
              greaterThanOrEqual: 10,
            },
          },
          {
            kind: "text",
            label: "Window",
            disabledWhen: {
              kind: "field-comparison",
              field: "minimum",
              otherField: "maximum",
              operator: "gte",
            },
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    expect(form.getField("summary")?.state.visible).toBe(true);
    expect(form.getField("window")?.state.disabled).toBe(false);

    form.setValues({
      minimum: 10,
      maximum: 12,
    });

    expect(form.getField("summary")?.state.visible).toBe(false);
    expect(form.getField("window")?.state.disabled).toBe(false);

    form.setValues({
      minimum: 12,
      maximum: 12,
    });

    expect(form.getField("window")?.state.disabled).toBe(true);
  });

  it("runs cross-field validators and validation hooks", async () => {
    const beforeValidate = vi.fn();
    const afterValidate = vi.fn();

    const form = createForm({
      schema: {
        fields: [
          {
            kind: "number",
            label: "Min",
            required: true,
          },
          {
            kind: "number",
            label: "Max",
            required: true,
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
      validators: [
        ({ values }) => {
          const min = values.min as number | null;
          const max = values.max as number | null;

          if (min !== null && max !== null && min > max) {
            return {
              form: ["Minimum cannot be greater than maximum."],
              fields: {
                min: ["Must be less than or equal to max."],
                max: ["Must be greater than or equal to min."],
              },
            };
          }

          return undefined;
        },
      ],
      hooks: {
        beforeValidate,
        afterValidate,
      },
    });

    form.setValues({
      min: 10,
      max: 5,
    });

    const result = await form.validate();

    expect(beforeValidate).toHaveBeenCalledWith({
      submitCount: 0,
      values: {
        min: 10,
        max: 5,
      },
    });
    expect(result.valid).toBe(false);
    expect(result.formErrors).toEqual(["Minimum cannot be greater than maximum."]);
    expect(result.fields.min).toEqual(["Must be less than or equal to max."]);
    expect(result.fields.max).toEqual(["Must be greater than or equal to min."]);
    expect(afterValidate).toHaveBeenCalledWith({
      submitCount: 0,
      values: {
        min: 10,
        max: 5,
      },
      result,
    });
  });

  it("treats form-level errors as invalid and blocks submit", async () => {
    const submit = vi.fn().mockResolvedValue({ reports: {} });
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
            required: true,
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: { submit },
      validators: [
        () => ({
          form: ["System is not ready."],
        }),
      ],
    });

    form.setValues({ name: "Alice" });

    const validation = await form.validate();

    expect(validation.valid).toBe(false);
    expect(form.state.valid).toBe(false);
    expect(validation.formErrors).toEqual(["System is not ready."]);
    await expect(form.submit()).rejects.toBeInstanceOf(ValidationError);
    expect(submit).not.toHaveBeenCalled();
  });

  it("ignores stale async form-level validation results after values change", async () => {
    let resolveValidator: ((issue: { form: string[] }) => void) | undefined;

    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
      validators: [
        async () =>
          new Promise((resolve) => {
            resolveValidator = resolve as (issue: { form: string[] }) => void;
          }),
      ],
    });

    form.setValues({ name: "Initial" });
    const pendingValidation = form.validate();
    form.setValues({ name: "Changed" });
    resolveValidator?.({ form: ["Stale error"] });

    const result = await pendingValidation;

    expect(result.valid).toBe(true);
    expect(result.formErrors).toEqual([]);
    expect(form.state.errors.form).toEqual([]);
    expect(form.getValues()).toEqual({ name: "Changed" });
  });

  it("throws when a form validator reports an unknown field id", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
      validators: [
        () => ({
          fields: {
            missing: ["Unknown field"],
          },
        }),
      ],
    });

    await expect(form.validate()).rejects.toThrow(EngineError);
  });

  it("provides form validators with public field snapshots only", async () => {
    const validator = vi.fn(({ fields }) => {
      expect(fields.name).toEqual({
        value: "",
        initialValue: "",
        touched: true,
        dirty: false,
        valid: true,
        visible: true,
        disabled: false,
        readOnly: false,
        errors: [],
        status: "valid",
      });
      expect("syncErrors" in fields.name).toBe(false);
      expect("validationErrors" in fields.name).toBe(false);
      expect("externalErrors" in fields.name).toBe(false);
      return undefined;
    });

    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
      validators: [validator],
    });

    await form.validate();

    expect(validator).toHaveBeenCalledTimes(1);
  });

  it("recovers cleanly when validation hooks throw during submit", async () => {
    const submit = vi.fn().mockResolvedValue({ reports: {} });
    const beforeValidate = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("validation hook failed"))
      .mockResolvedValue(undefined);

    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
            required: true,
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: { submit },
      hooks: {
        beforeValidate,
      },
    });

    form.setValues({ name: "Alice" });

    await expect(form.submit()).rejects.toThrow("validation hook failed");
    expect(form.state.status).toBe("error");
    expect(form.state.errors.form).toEqual(["validation hook failed"]);

    form.setValues({ name: "Bob" });
    await form.submit();

    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("preserves async field validation results during form validation", async () => {
    const registry = createBuiltinRegistry();

    registry.registerField({
      kind: "async-text",
      schema: {
        parse(input: unknown) {
          return input as {
            kind: "async-text";
            label: string;
            id?: string;
          };
        },
      } as never,
      normalizeValue(value) {
        return typeof value === "string" ? value : "";
      },
      validate: async (value) => {
        await Promise.resolve();
        return value === "taken" ? ["Already taken."] : [];
      },
      describe(config, context) {
        return {
          component: "async-text",
          props: {
            id: config.id,
            value: context.state.value,
          },
        };
      },
    });

    const form = createForm({
      schema: {
        fields: [
          {
            kind: "async-text",
            label: "Username",
          },
        ],
      },
      registry,
      transport: {
        submit: vi.fn(),
      },
    });

    form.setValues({ username: "taken" });
    const result = await form.validate();

    expect(result.valid).toBe(false);
    expect(result.fields.username).toEqual(["Already taken."]);
    expect(form.getField("username")?.state.errors).toEqual(["Already taken."]);
  });

  it("supports thenable field validators", async () => {
    const registry = createBuiltinRegistry();
    class ThenableValidationResult implements PromiseLike<string[]> {
      constructor(private readonly errors: string[]) {}

      // oxlint-disable-next-line unicorn/no-thenable -- explicit coverage for promise-like validators
      then<TResult1 = string[], TResult2 = never>(
        onfulfilled?: ((value: string[]) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
      ): PromiseLike<TResult1 | TResult2> {
        return Promise.resolve(this.errors).then(onfulfilled, onrejected);
      }
    }

    registry.registerField({
      kind: "thenable-text",
      schema: {
        parse(input: unknown) {
          return input as {
            kind: "thenable-text";
            label: string;
            id?: string;
          };
        },
      } as never,
      normalizeValue(value) {
        return typeof value === "string" ? value : "";
      },
      validate: (value) =>
        new ThenableValidationResult(value === "taken" ? ["Taken by thenable."] : []),
      describe(config, context) {
        return {
          component: "thenable-text",
          props: {
            id: config.id,
            value: context.state.value,
          },
        };
      },
    });

    const form = createForm({
      schema: {
        fields: [
          {
            kind: "thenable-text",
            label: "Username",
          },
        ],
      },
      registry,
      transport: {
        submit: vi.fn(),
      },
    });

    form.setValues({ username: "taken" });
    const result = await form.validate();

    expect(result.valid).toBe(false);
    expect(result.fields.username).toEqual(["Taken by thenable."]);
  });

  it("debounces and cancels stale async field validation runs", async () => {
    const registry = createBuiltinRegistry();
    const validate = vi.fn(async (value: string) => {
      await Promise.resolve();
      return value === "taken" ? ["Already taken."] : [];
    });

    registry.registerField({
      kind: "debounced-text",
      schema: {
        parse(input: unknown) {
          return input as {
            kind: "debounced-text";
            label: string;
            id?: string;
            asyncValidationDebounceMs?: number;
          };
        },
      } as never,
      normalizeValue(value) {
        return typeof value === "string" ? value : "";
      },
      validate,
      describe(config, context) {
        return {
          component: "debounced-text",
          props: {
            id: config.id,
            value: context.state.value,
          },
        };
      },
    });

    const form = createForm({
      schema: {
        fields: [
          {
            kind: "debounced-text",
            label: "Username",
            asyncValidationDebounceMs: 25,
          },
        ],
      },
      registry,
      transport: {
        submit: vi.fn(),
      },
    });

    form.setValues({ username: "taken" });
    const firstValidation = form.getField("username")!.validate();

    form.setValues({ username: "available" });
    const secondValidation = form.getField("username")!.validate();

    const [firstResult, secondResult] = await Promise.all([firstValidation, secondValidation]);

    expect(validate).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual({
      fieldId: "username",
      valid: true,
      errors: [],
    });
    expect(secondResult).toEqual({
      fieldId: "username",
      valid: true,
      errors: [],
    });
    expect(form.getField("username")?.state.errors).toEqual([]);
  });

  it("applies setValues transactionally using the final snapshot", () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "boolean",
            label: "Advanced",
          },
          {
            kind: "text",
            label: "Secret",
            hiddenWhen: ({ values }) => values.advanced !== true,
            disabledWhen: ({ values }) => values.advanced !== true,
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    expect(() => {
      form.setValues({
        advanced: true,
        secret: "allowed",
      });
    }).not.toThrow();

    expect(form.getValues()).toEqual({
      advanced: true,
      secret: "allowed",
    });
  });

  it("recomputes dependent field state when using FieldController.setValue", () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "boolean",
            label: "Advanced",
          },
          {
            kind: "text",
            label: "Secret",
            hiddenWhen: ({ values }) => values.advanced !== true,
            disabledWhen: ({ values }) => values.advanced !== true,
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    form.getField("advanced")?.setValue(true);

    expect(form.state.status).toBe("editing");
    expect(form.getValues()).toEqual({
      advanced: true,
      secret: "",
    });
    expect(form.getField("secret")?.state.visible).toBe(true);
    expect(form.getField("secret")?.state.disabled).toBe(false);
  });

  it("does not partially apply setValues when a later field update fails", () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "boolean",
            label: "Advanced",
          },
          {
            kind: "text",
            label: "Locked",
            readOnlyWhen: ({ values }) => values.advanced === true,
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    expect(() => {
      form.setValues({
        advanced: true,
        locked: "forbidden",
      });
    }).toThrow(EngineError);

    expect(form.getValues()).toEqual({
      advanced: false,
      locked: "",
    });
  });

  it("serializes values and updates report controllers after submit", async () => {
    const submit = vi.fn().mockResolvedValue({
      reports: {
        risk: {
          labels: ["low", "high"],
          probabilities: [0.2, 0.8],
          prediction: "high",
        },
      },
      meta: {
        requestId: "abc-123",
      },
    });

    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
            required: true,
          },
          {
            kind: "date",
            label: "Birthday",
            required: true,
          },
        ],
        reports: [
          {
            kind: "classifier",
            id: "risk",
            label: "Risk",
            details: true,
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit,
      },
    });

    form.setValues({
      name: "Alice",
      birthday: "2025-01-02",
    });

    const result = await form.submit();

    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        values: {
          name: "Alice",
          birthday: expect.any(Date),
        },
        serializedValues: {
          name: "Alice",
          birthday: "2025-01-02T00:00:00.000Z",
        },
      }),
    );
    expect(result.meta).toEqual({ requestId: "abc-123" });
    expect(result.reportStates).toEqual({
      risk: {
        payload: {
          labels: ["low", "high"],
          probabilities: [0.2, 0.8],
          prediction: "high",
        },
        error: null,
        status: "ready",
      },
    });
    expect(form.state.status).toBe("success");
    expect(form.state.submitCount).toBe(1);
    expect(form.reports[0]?.state.status).toBe("ready");
    expect(form.reports[0]?.descriptor).toEqual({
      component: "classifier-report",
      props: expect.objectContaining({
        id: "risk",
        label: "Risk",
        payload: {
          labels: ["low", "high"],
          probabilities: [0.2, 0.8],
          prediction: "high",
        },
      }),
    });
  });

  it("throws ValidationError when submit is attempted with invalid data", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "Email",
            required: true,
            pattern: "^[^@]+@[^@]+\\.[^@]+$",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    form.setValues({
      email: "bad-email",
    });

    await expect(form.submit()).rejects.toBeInstanceOf(ValidationError);
    expect(form.state.submitCount).toBe(0);
  });

  it("surfaces transport failures as SubmitError and resets reports", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
            required: true,
          },
        ],
        reports: [
          {
            kind: "regressor",
            id: "score",
            label: "Score",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn().mockRejectedValue(new Error("backend offline")),
      },
    });

    form.setValues({
      name: "Alice",
    });

    await expect(form.submit()).rejects.toBeInstanceOf(SubmitError);
    expect(form.state.status).toBe("error");
    expect(form.state.errors.form).toEqual(["backend offline"]);
    expect(form.reports[0]?.state.status).toBe("idle");
  });

  it("surfaces report payload failures as report-local error state without failing submit", async () => {
    const registry = createBuiltinRegistry();

    registry
      .registerReport({
        kind: "good-report",
        schema: {
          parse(input: unknown) {
            return input as {
              kind: "good-report";
              id?: string;
              source?: string;
            };
          },
        } as never,
        resolvePayload(_config, context) {
          return context.result.reports.good;
        },
        describe(config, context) {
          return {
            component: "good-report",
            props: {
              id: config.id,
              payload: context.payload,
            },
          };
        },
      })
      .registerReport({
        kind: "bad-report",
        schema: {
          parse(input: unknown) {
            return input as {
              kind: "bad-report";
              id?: string;
              source?: string;
            };
          },
        } as never,
        resolvePayload() {
          throw new Error("report payload failed");
        },
        describe(config, context) {
          return {
            component: "bad-report",
            props: {
              id: config.id,
              payload: context.payload,
            },
          };
        },
      });

    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
            required: true,
          },
        ],
        reports: [
          {
            kind: "good-report",
            id: "good",
          },
          {
            kind: "bad-report",
            id: "bad",
          },
        ],
      },
      registry,
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: {
            good: { score: 1 },
          },
        }),
      },
    });

    form.setValues({ name: "Alice" });

    const result = await form.submit();

    expect(form.state.status).toBe("success");
    expect(form.state.lastResult).toEqual(result);
    expect(result.reportStates).toEqual({
      good: {
        payload: { score: 1 },
        error: null,
        status: "ready",
      },
      bad: {
        payload: undefined,
        error: "report payload failed",
        status: "error",
      },
    });
    expect(form.getReport("good")?.state.status).toBe("ready");
    expect(form.getReport("good")?.state.error).toBeNull();
    expect(form.getReport("bad")?.state.status).toBe("error");
    expect(form.getReport("bad")?.state.error).toBe("report payload failed");
  });

  it("supports before/after submit hooks and passes abort signals to transport", async () => {
    const beforeSubmit = vi.fn();
    const afterSubmit = vi.fn();
    const submit = vi.fn().mockImplementation(async (request) => {
      expect(request.signal).toBeDefined();
      expect(request.signal?.aborted).toBe(false);
      return {
        reports: {
          classifier: { prediction: "ok" },
        },
      };
    });

    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
            required: true,
          },
        ],
        reports: [
          {
            kind: "classifier",
            id: "classifier",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: { submit },
      hooks: {
        beforeSubmit,
        afterSubmit,
      },
    });

    form.setValues({ name: "Alice" });

    const result = await form.submit();

    expect(beforeSubmit).toHaveBeenCalledWith({
      values: { name: "Alice" },
      serializedValues: { name: "Alice" },
      submitCount: 1,
      signal: expect.any(AbortSignal),
    });
    expect(afterSubmit).toHaveBeenCalledWith({
      values: { name: "Alice" },
      serializedValues: { name: "Alice" },
      submitCount: 1,
      result,
    });
  });

  it("omits inactive fields from submission by default", async () => {
    const submit = vi.fn().mockResolvedValue({ reports: {} });
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "boolean",
            label: "Advanced",
          },
          {
            kind: "text",
            label: "Secret",
            hiddenWhen: ({ values }) => values.advanced !== true,
            disabledWhen: ({ values }) => values.advanced !== true,
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: { submit },
    });

    form.setValues({ advanced: true, secret: "hidden-value" });
    form.setValues({ advanced: false });

    const result = await form.submit();

    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        values: {
          advanced: false,
        },
        serializedValues: {
          advanced: false,
        },
      }),
    );
    expect(result.values).toEqual({
      advanced: false,
    });
  });

  it("aborts in-flight submissions and routes the error through hooks", async () => {
    const onSubmitError = vi.fn();
    const submit = vi.fn().mockImplementation(
      ({ signal }: { signal?: AbortSignal }) =>
        new Promise((resolve, reject) => {
          signal?.addEventListener(
            "abort",
            () => {
              reject(new Error("transport aborted"));
            },
            { once: true },
          );

          setTimeout(() => {
            resolve({
              reports: {
                classifier: { prediction: "late" },
              },
            });
          }, 50);
        }),
    );

    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
            required: true,
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: { submit },
      hooks: {
        onSubmitError,
      },
    });

    form.setValues({ name: "Alice" });

    const pendingSubmit = form.submit();
    form.abortSubmit("user-cancelled");

    await expect(pendingSubmit).rejects.toBeInstanceOf(SubmissionAbortedError);
    expect(form.state.status).toBe("idle");
    expect(form.state.errors.form).toEqual(["Form submission was aborted: user-cancelled"]);
    expect(onSubmitError).toHaveBeenCalledWith({
      values: { name: "Alice" },
      serializedValues: { name: "Alice" },
      submitCount: 1,
      error: expect.any(SubmissionAbortedError),
    });
  });

  it("resets field and report state back to initial values", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
            required: true,
            defaultValue: "Initial",
          },
        ],
        reports: [
          {
            kind: "classifier",
            id: "risk",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: {
            risk: { prediction: "low" },
          },
        }),
      },
    });

    form.setValues({ name: "Changed" });
    await form.submit();
    form.reset();

    expect(form.state.status).toBe("idle");
    expect(form.getValues()).toEqual({ name: "Initial" });
    expect(form.state.lastResult).toBeNull();
    expect(form.reports[0]?.state.status).toBe("idle");
  });

  it("does not let a stale submit overwrite state after reset", async () => {
    let resolveSubmit: ((value: { reports: Record<string, unknown> }) => void) | undefined;

    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
            required: true,
            defaultValue: "Initial",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn().mockImplementation(
          () =>
            new Promise((resolve) => {
              resolveSubmit = resolve as (value: { reports: Record<string, unknown> }) => void;
            }),
        ),
      },
    });

    form.setValues({ name: "Changed" });
    const pending = form.submit();
    form.reset();
    resolveSubmit?.({ reports: {} });

    await expect(pending).rejects.toBeInstanceOf(SubmissionAbortedError);
    expect(form.state.status).toBe("idle");
    expect(form.state.lastResult).toBeNull();
    expect(form.getValues()).toEqual({ name: "Initial" });
  });
});
