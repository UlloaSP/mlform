// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import * as z from "zod";
import {
  EngineError,
  RegistryError,
  type FieldController,
  ReportPayloadError,
  SubmissionAbortedError,
  SubmitError,
  ValidationError,
  createBuiltinRegistry,
  createForm,
  defineExplanationDefinition,
  defineExplanationKind,
  defineFieldKind,
  defineReportKind,
  executeFormPipeline,
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
            placeholder: "Enter age",
          },
          {
            kind: "date",
            label: "Launch Date",
            step: 7,
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

    expect(form.fields).toHaveLength(3);
    expect(form.reports).toHaveLength(1);
    expect(form.fields[0]?.id).toBe("customer-name");
    expect(form.fields[1]?.id).toBe("age");
    expect(form.fields[2]?.id).toBe("launch-date");
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
    expect(form.fields[1]?.descriptor).toEqual({
      component: "number-field",
      props: expect.objectContaining({
        id: "age",
        label: "Age",
        min: 18,
        placeholder: "Enter age",
        value: null,
      }),
    });
    expect(form.fields[2]?.descriptor).toEqual({
      component: "date-field",
      props: expect.objectContaining({
        id: "launch-date",
        label: "Launch Date",
        step: 7,
        value: null,
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

  it("treats legacy range and option restrictions as field validation instead of schema parse failures", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            id: "category",
            kind: "category",
            label: "Category",
            options: ["A", "B"],
            defaultValue: "Z",
          },
          {
            id: "text",
            kind: "text",
            label: "Text",
            minLength: 5,
            maxLength: 3,
          },
          {
            id: "number",
            kind: "number",
            label: "Number",
            min: 10,
            max: 5,
            defaultValue: 3,
          },
          {
            id: "date",
            kind: "date",
            label: "Date",
            min: "2026-12-31",
            max: "2026-01-01",
            defaultValue: "2025-06-15",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    expect(form.getField("category")?.state.errors).toContain(
      "Value must match one of the available options.",
    );
    expect(form.getField("text")?.state.errors).toContain(
      "Minimum length cannot exceed maximum length.",
    );
    expect(form.getField("number")?.state.errors).toContain(
      "Minimum value cannot exceed maximum value.",
    );
    expect(form.getField("date")?.state.errors).toContain(
      "Minimum date cannot be after maximum date.",
    );

    const validation = await form.validate();

    expect(validation.valid).toBe(false);
    expect(validation.fields.category).toContain("Value must match one of the available options.");
    expect(validation.fields.text).toContain("Minimum length cannot exceed maximum length.");
    expect(validation.fields.number).toContain("Minimum value cannot exceed maximum value.");
    expect(validation.fields.date).toContain("Minimum date cannot be after maximum date.");
  });

  it("keeps default values out of bounds as field validation errors", () => {
    const form = createForm({
      schema: {
        fields: [
          {
            id: "text",
            kind: "text",
            label: "Text",
            minLength: 3,
            maxLength: 5,
            defaultValue: "ab",
          },
          {
            id: "number",
            kind: "number",
            label: "Number",
            min: 10,
            max: 20,
            defaultValue: 30,
          },
          {
            id: "date",
            kind: "date",
            label: "Date",
            min: "2026-01-01",
            max: "2026-12-31",
            defaultValue: "2027-01-01",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    expect(form.getField("text")?.state.errors).toContain("Minimum length is 3 characters.");
    expect(form.getField("number")?.state.errors).toContain("Maximum value is 20.");
    expect(form.getField("date")?.state.errors).toContain("Date must be on or before 2026-12-31.");
  });

  it("rejects series configs when minPoints exceeds maxPoints during schema normalization", () => {
    expect(() =>
      createForm({
        schema: {
          fields: [
            {
              id: "series",
              kind: "series",
              label: "Series",
              field1: { kind: "date", label: "field1", required: true },
              field2: { kind: "number", label: "field2", required: true },
              minPoints: 3,
              maxPoints: 1,
              minDate: "2026-12-31",
              maxDate: "2026-01-01",
              minValue: 100,
              maxValue: 10,
              defaultValue: [{ field1: "2025-06-15", field2: 5 }],
            },
          ],
        },
        registry: createBuiltinRegistry(),
        transport: {
          submit: vi.fn(),
        },
      }),
    ).toThrow("minPoints to be less than or equal to maxPoints");
  });

  it("rejects nested series sub-fields during schema normalization", () => {
    expect(() =>
      createForm({
        schema: {
          fields: [
            {
              kind: "series",
              label: "Nested series",
              field1: { kind: "series", label: "field1" },
              field2: { kind: "number", label: "field2" },
            },
          ],
        },
        registry: createBuiltinRegistry(),
        transport: {
          submit: vi.fn(),
        },
      }),
    ).toThrow('cannot nest series in "field1"');
  });

  it("rejects unknown series sub-field kinds during schema normalization", () => {
    expect(() =>
      createForm({
        schema: {
          fields: [
            {
              kind: "series",
              label: "Unknown series",
              field1: { kind: "date", label: "field1" },
              field2: { kind: "mystery", label: "field2" },
            },
          ],
        },
        registry: createBuiltinRegistry(),
        transport: {
          submit: vi.fn(),
        },
      }),
    ).toThrow('unknown sub-field kind "mystery"');
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

  it("exposes frozen controller collections and configs", () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
            ui: {
              tone: "quiet",
            },
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    expect(Object.isFrozen(form.fields)).toBe(true);
    expect(Object.isFrozen(form.reports)).toBe(true);
    expect(Object.isFrozen(form.fields[0]!.config)).toBe(true);
    expect(Object.isFrozen((form.fields[0]!.config as { ui?: object }).ui ?? null)).toBe(true);

    expect(() => {
      (form.fields as FieldController[]).push(form.fields[0]!);
    }).toThrow(TypeError);
  });

  it("emits a single form notification for batched setValues updates", () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "First",
          },
          {
            kind: "text",
            label: "Second",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    const formListener = vi.fn();
    const firstFieldListener = vi.fn();
    const unsubscribeForm = form.subscribe(formListener);
    const unsubscribeField = form.getField("first")!.subscribe(firstFieldListener);

    form.setValues({
      first: "A",
      second: "B",
    });

    expect(formListener).toHaveBeenCalledTimes(1);
    expect(firstFieldListener).toHaveBeenCalledTimes(1);

    unsubscribeForm();
    unsubscribeField();
  });

  it("isolates listener failures when configured to ignore them", () => {
    const onListenerError = vi.fn();
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
      listenerErrorPolicy: "ignore",
      onListenerError,
    });

    const failingListener = vi.fn(() => {
      throw new Error("listener failed");
    });
    const healthyListener = vi.fn();

    form.subscribe(failingListener);
    form.subscribe(healthyListener);

    expect(() => {
      form.setValues({ name: "Alice" });
    }).not.toThrow();

    expect(failingListener).toHaveBeenCalledTimes(1);
    expect(healthyListener).toHaveBeenCalledTimes(1);
    expect(onListenerError).toHaveBeenCalledWith(expect.any(Error), expect.any(Object));
  });

  it("can aggregate listener failures after notifying all listeners", () => {
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
      listenerErrorPolicy: "throw-aggregate",
    });

    const failingListener = vi.fn(() => {
      throw new Error("listener failed");
    });
    const healthyListener = vi.fn();

    form.subscribe(failingListener);
    form.subscribe(healthyListener);

    expect(() => {
      form.setValues({ name: "Alice" });
    }).toThrow("Store listener notification failed.");

    expect(failingListener).toHaveBeenCalledTimes(1);
    expect(healthyListener).toHaveBeenCalledTimes(1);
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

  it("supports bigint declarative comparisons without losing precision", () => {
    const registry = createBuiltinRegistry();

    registry.registerField({
      kind: "bigint",
      schema: z
        .object({
          kind: z.literal("bigint"),
          id: z.string().optional(),
          label: z.string(),
          hiddenWhen: z.any().optional(),
          disabledWhen: z.any().optional(),
          readOnlyWhen: z.any().optional(),
        })
        .passthrough(),
      getDefaultValue() {
        return 0n;
      },
      normalizeValue(value) {
        if (typeof value === "bigint") {
          return value;
        }

        if (typeof value === "number" || typeof value === "string") {
          return BigInt(value);
        }

        return 0n;
      },
      describe(config, context) {
        return {
          component: "bigint-field",
          props: {
            id: config.id,
            label: config.label,
            value: context.state.value,
          },
        };
      },
    });

    const form = createForm({
      schema: {
        fields: [
          {
            kind: "bigint",
            label: "Minimum",
          },
          {
            kind: "bigint",
            label: "Maximum",
          },
          {
            kind: "text",
            label: "Window",
            disabledWhen: {
              kind: "field-comparison",
              field: "minimum",
              otherField: "maximum",
              operator: "gt",
            },
          },
        ],
      },
      registry,
      transport: {
        submit: vi.fn(),
      },
    });

    form.setValues({
      minimum: 9007199254740993n,
      maximum: 9007199254740992n,
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
    const publicFieldState = form.getField("name")!.state as unknown as Record<string, unknown>;
    expect("syncErrors" in publicFieldState).toBe(false);
    expect("validationErrors" in publicFieldState).toBe(false);
    expect("externalErrors" in publicFieldState).toBe(false);
  });

  it("protects public value snapshots from external mutation", () => {
    const registry = createBuiltinRegistry();
    registry.registerField({
      kind: "object-value",
      schema: z.object({
        kind: z.literal("object-value"),
        label: z.string(),
        id: z.string().optional(),
        defaultValue: z.unknown().optional(),
      }),
      getDefaultValue() {
        return { nested: { items: [1] } };
      },
      normalizeValue(value) {
        return value && typeof value === "object" ? value : { nested: { items: [] } };
      },
      serializeValue(value) {
        return value;
      },
      describe(config, context) {
        return {
          component: "object-value",
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
            kind: "object-value",
            label: "Payload",
          },
        ],
      },
      registry,
      transport: {
        submit: vi.fn(),
      },
    });

    const values = form.getValues() as { payload: { nested: { items: number[] } } };
    values.payload.nested.items.push(2);

    const fieldSnapshot = form.getField("payload")!.state as unknown as {
      value: { nested: { items: number[] } };
    };
    fieldSnapshot.value.nested.items.push(3);

    expect(form.getValues()).toEqual({
      payload: {
        nested: {
          items: [1],
        },
      },
    });
  });

  it("protects public report snapshots and submit results from external mutation", async () => {
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
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: {
            classifier: {
              labels: ["low", "high"],
              probabilities: [0.25, 0.75],
              prediction: "high",
            },
          },
        }),
      },
    });

    form.setValues({ name: "Alice" });
    const result = await form.submit();

    const reportState = form.getReport("classifier")!.state as {
      payload: { labels: string[]; probabilities: number[]; prediction: string };
    };
    reportState.payload.labels.push("mutated");
    result.reportStates.classifier!.payload = {
      labels: ["broken"],
      probabilities: [1],
      prediction: "broken",
    };

    expect(form.getReport("classifier")?.state).toEqual({
      payload: {
        labels: ["low", "high"],
        probabilities: [0.25, 0.75],
        prediction: "high",
      },
      error: null,
      status: "ready",
    });
    expect(form.state.lastResult?.reportStates.classifier).toEqual({
      payload: {
        labels: ["low", "high"],
        probabilities: [0.25, 0.75],
        prediction: "high",
      },
      error: null,
      status: "ready",
    });
  });

  it("uses semantic field equality for dirty tracking", () => {
    const registry = createBuiltinRegistry();
    registry.registerField({
      kind: "case-insensitive-text",
      schema: z.object({
        kind: z.literal("case-insensitive-text"),
        label: z.string(),
        id: z.string().optional(),
        defaultValue: z.string().optional(),
      }),
      getDefaultValue(config) {
        return config.defaultValue ?? "";
      },
      normalizeValue(value) {
        return typeof value === "string" ? value : "";
      },
      isEqual(previous, next) {
        return previous.toLowerCase() === next.toLowerCase();
      },
      describe(config, context) {
        return {
          component: "case-insensitive-text",
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
            kind: "case-insensitive-text",
            label: "Code",
            defaultValue: "abc",
          },
        ],
      },
      registry,
      transport: {
        submit: vi.fn(),
      },
    });

    form.setValues({ code: "ABC" });

    expect(form.getField("code")?.state.dirty).toBe(false);
    expect(form.state.dirty).toBe(false);
  });

  it("supports semantic cloning and equality for typed array field values", () => {
    const registry = createBuiltinRegistry();
    registry.registerField({
      kind: "tensor-value",
      schema: z.object({
        kind: z.literal("tensor-value"),
        label: z.string(),
        id: z.string().optional(),
        defaultValue: z.instanceof(Uint8Array).optional(),
      }),
      getDefaultValue(config) {
        return config.defaultValue ?? new Uint8Array();
      },
      normalizeValue(value) {
        return value instanceof Uint8Array ? value : new Uint8Array();
      },
      serializeValue(value) {
        return Array.from(value);
      },
      describe(config, context) {
        return {
          component: "tensor-value",
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
            kind: "tensor-value",
            label: "Tensor",
            defaultValue: new Uint8Array([1, 2]),
          },
        ],
      },
      registry,
      transport: {
        submit: vi.fn(),
      },
    });

    form.setValues({
      tensor: new Uint8Array([1, 2]),
    });
    expect(form.getField("tensor")?.state.dirty).toBe(false);

    const values = form.getValues() as { tensor: Uint8Array };
    values.tensor[0] = 9;
    expect(Array.from((form.getValues() as { tensor: Uint8Array }).tensor)).toEqual([1, 2]);

    form.setValues({
      tensor: new Uint8Array([2, 3]),
    });
    expect(form.getField("tensor")?.state.dirty).toBe(true);
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

  it("surfaces afterValidate failures without masking them as invalid transitions", async () => {
    const submit = vi.fn().mockResolvedValue({ reports: {} });
    const afterValidate = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("after validation hook failed"))
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
        afterValidate,
      },
    });

    form.setValues({ name: "Alice" });

    await expect(form.submit()).rejects.toThrow("after validation hook failed");
    expect(form.state.status).toBe("error");
    expect(form.state.errors.form).toEqual(["after validation hook failed"]);
    expect(submit).not.toHaveBeenCalled();

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

  it("exposes a field validating status while async field validation is pending", async () => {
    const registry = createBuiltinRegistry();
    let resolveValidation: ((errors: string[]) => void) | undefined;

    registry.registerField({
      kind: "pending-text",
      schema: {
        parse(input: unknown) {
          return input as {
            kind: "pending-text";
            label: string;
            id?: string;
          };
        },
      } as never,
      normalizeValue(value) {
        return typeof value === "string" ? value : "";
      },
      validate: () =>
        new Promise<string[]>((resolve) => {
          resolveValidation = resolve;
        }),
      describe(config, context) {
        return {
          component: "pending-text",
          props: {
            id: config.id,
            status: context.state.status,
          },
        };
      },
    });

    const form = createForm({
      schema: {
        fields: [
          {
            kind: "pending-text",
            label: "Username",
          },
        ],
      },
      registry,
      transport: {
        submit: vi.fn(),
      },
    });

    form.setValues({ username: "alice" });
    const pendingValidation = form.validate();
    await Promise.resolve();

    expect(form.getField("username")?.state.status).toBe("validating");
    expect(form.getField("username")?.descriptor.props.status).toBe("validating");

    resolveValidation?.([]);
    const result = await pendingValidation;

    expect(result.valid).toBe(true);
    expect(form.getField("username")?.state.status).toBe("valid");
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
    expect(form.state.reportStates).toEqual(result.reportStates);
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

  it("builds nested submission values from field valuePath while keeping flat field values", async () => {
    const submit = vi.fn().mockResolvedValue({ reports: {} });
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
            valuePath: "person.name",
          },
          {
            kind: "date",
            label: "Birthday",
            valuePath: ["person", "birthday"],
          },
          {
            kind: "number",
            label: "Score",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: { submit },
    });

    form.setValues({
      name: "Alice",
      birthday: "2025-01-02",
      score: 10,
    });

    const result = await form.submit();

    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        values: {
          person: {
            name: "Alice",
            birthday: expect.any(Date),
          },
          score: 10,
        },
        fieldValues: {
          name: "Alice",
          birthday: expect.any(Date),
          score: 10,
        },
        serializedValues: {
          person: {
            name: "Alice",
            birthday: "2025-01-02T00:00:00.000Z",
          },
          score: 10,
        },
        serializedFieldValues: {
          name: "Alice",
          birthday: "2025-01-02T00:00:00.000Z",
          score: 10,
        },
      }),
    );
    expect(result.values).toEqual({
      person: {
        name: "Alice",
        birthday: expect.any(Date),
      },
      score: 10,
    });
    expect(result.fieldValues).toEqual({
      name: "Alice",
      birthday: expect.any(Date),
      score: 10,
    });
  });

  it("classifier descriptor is populated after submit", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
          },
        ],
        reports: [
          {
            kind: "classifier",
            id: "risk",
            label: "Risk",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: {
            risk: {
              prediction: "high",
              probabilities: [0.1, 0.9],
            },
          },
        }),
      },
    });

    form.setValues({ name: "Alice" });
    await form.submit();

    expect(form.reports[0]?.descriptor?.props.id).toBe("risk");
    expect(form.reports[0]?.descriptor?.props).not.toHaveProperty("explanations");
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
    expect(form.state.reportStates).toEqual(result.reportStates);
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

  it("validates report payloads with report payload schemas", async () => {
    const registry = createBuiltinRegistry();

    registry.registerReport({
      kind: "typed-score",
      schema: z.object({
        kind: z.literal("typed-score"),
        id: z.string().optional(),
        source: z.string().optional(),
      }),
      payloadSchema: z.object({
        score: z.number(),
      }),
      describe(config, context) {
        return {
          component: "typed-score",
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
            kind: "typed-score",
            id: "score",
          },
        ],
      },
      registry,
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: {
            score: {
              score: "not-a-number",
            },
          },
        }),
      },
    });

    form.setValues({ name: "Alice" });
    const result = await form.submit();

    expect(result.reportStates.score?.status).toBe("error");
    expect(result.reportStates.score?.error).toContain("number");
  });

  it("can fail the full submission when a report payload is invalid", async () => {
    const registry = createBuiltinRegistry();
    const onSubmitError = vi.fn();

    registry.registerReport({
      kind: "strict-score",
      schema: z.object({
        kind: z.literal("strict-score"),
        id: z.string().optional(),
        source: z.string().optional(),
      }),
      payloadSchema: z.object({
        score: z.number(),
      }),
      payloadValidationPolicy: "fail-submit",
      describe(config, context) {
        return {
          component: "strict-score",
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
            kind: "strict-score",
            id: "score",
          },
        ],
      },
      registry,
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: {
            score: {
              score: "not-a-number",
            },
          },
        }),
      },
      hooks: {
        onSubmitError,
      },
    });

    form.setValues({ name: "Alice" });

    await expect(form.submit()).rejects.toMatchObject({
      cause: expect.any(ReportPayloadError),
    });
    expect(form.state.status).toBe("error");
    expect(onSubmitError).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.any(ReportPayloadError),
      }),
    );
  });

  it("supports async report payload resolvers", async () => {
    const registry = createBuiltinRegistry();

    registry.registerReport({
      kind: "async-report",
      schema: {
        parse(input: unknown) {
          return input as {
            kind: "async-report";
            id?: string;
            source?: string;
          };
        },
      } as never,
      async resolvePayload(_config, context) {
        await Promise.resolve();
        return context.result.reports.async;
      },
      describe(config, context) {
        return {
          component: "async-report",
          props: {
            id: config.id,
            payload: context.payload,
            status: context.state.status,
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
            kind: "async-report",
            id: "async",
          },
        ],
      },
      registry,
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: {
            async: { score: 42 },
          },
        }),
      },
    });

    form.setValues({ name: "Alice" });

    const result = await form.submit();

    expect(result.reportStates.async).toEqual({
      payload: { score: 42 },
      error: null,
      status: "ready",
    });
    expect(form.getReport("async")?.descriptor).toEqual({
      component: "async-report",
      props: {
        id: "async",
        payload: { score: 42 },
        status: "ready",
      },
    });
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
      fieldValues: { name: "Alice" },
      serializedValues: { name: "Alice" },
      serializedFieldValues: { name: "Alice" },
      submitCount: 1,
      signal: expect.any(AbortSignal),
    });
    expect(afterSubmit).toHaveBeenCalledWith({
      values: { name: "Alice" },
      fieldValues: { name: "Alice" },
      serializedValues: { name: "Alice" },
      serializedFieldValues: { name: "Alice" },
      submitCount: 1,
      result,
    });
  });

  it("can preserve submit success when afterSubmit fails by policy", async () => {
    const afterSubmitError = new Error("analytics failed");
    const onSubmitError = vi.fn();
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
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: {
            classifier: { prediction: "ok" },
          },
        }),
      },
      hooks: {
        afterSubmit: vi.fn().mockRejectedValue(afterSubmitError),
        onSubmitError,
      },
      hookFailurePolicy: {
        afterSubmit: "preserve-success",
      },
    });

    form.setValues({ name: "Alice" });
    const result = await form.submit();

    expect(result.reportStates.classifier?.status).toBe("ready");
    expect(form.state.status).toBe("success");
    expect(form.state.lastResult).toEqual(result);
    expect(onSubmitError).toHaveBeenCalledWith({
      values: { name: "Alice" },
      fieldValues: { name: "Alice" },
      serializedValues: { name: "Alice" },
      serializedFieldValues: { name: "Alice" },
      submitCount: 1,
      error: afterSubmitError,
    });
  });

  it("passes optional backend selection through transport requests", async () => {
    const submit = vi.fn().mockImplementation(async ({ backend }: { backend?: string }) => ({
      reports: {
        classifier: { prediction: backend ?? "default" },
      },
    }));
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
    });

    form.setValues({ name: "Alice" });

    const result = await form.submit({ backend: "remote" });

    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        backend: "remote",
        values: { name: "Alice" },
      }),
    );
    expect(result.backend).toBe("remote");
    expect(result.reports.classifier).toEqual({ prediction: "remote" });
  });

  it("marks reports as loading while submit is in flight", async () => {
    let form: ReturnType<typeof createForm>;
    const beforeSubmit = vi.fn(() => {
      expect(form.getReport("classifier")?.state.status).toBe("loading");
      expect(form.state.reportStates.classifier?.status).toBe("loading");
    });
    const submit = vi.fn().mockResolvedValue({
      reports: {
        classifier: { prediction: "ok" },
      },
    });

    form = createForm({
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
      },
    });

    form.setValues({ name: "Alice" });
    await form.submit();

    expect(beforeSubmit).toHaveBeenCalledTimes(1);
    expect(form.getReport("classifier")?.state.status).toBe("ready");
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

  it("can reset inactive fields when they become hidden or disabled", async () => {
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
            defaultValue: "initial-secret",
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
        ],
      },
      registry: createBuiltinRegistry(),
      transport: { submit },
      inactiveFieldPolicy: "reset-on-hide",
    });

    form.setValues({ advanced: true, secret: "temporary-secret" });

    expect(form.getValues()).toEqual({
      advanced: true,
      secret: "temporary-secret",
    });

    form.setValues({ advanced: false });

    expect(form.getValues()).toEqual({
      advanced: false,
      secret: "initial-secret",
    });

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

  it("allows inactive field behavior to be overridden per field", async () => {
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
            defaultValue: "initial-secret",
            inactiveFieldPolicy: "reset-on-hide",
            hiddenWhen: ({ values }) => values.advanced !== true,
            disabledWhen: ({ values }) => values.advanced !== true,
          },
          {
            kind: "text",
            label: "Note",
            inactiveFieldPolicy: "include",
            hiddenWhen: ({ values }) => values.advanced !== true,
            disabledWhen: ({ values }) => values.advanced !== true,
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: { submit },
      inactiveFieldPolicy: "omit",
    });

    form.setValues({
      advanced: true,
      secret: "temporary-secret",
      note: "keep-me",
    });
    form.setValues({ advanced: false });

    expect(form.getValues()).toEqual({
      advanced: false,
      secret: "initial-secret",
      note: "keep-me",
    });

    const result = await form.submit();

    expect(result.values).toEqual({
      advanced: false,
      note: "keep-me",
    });
    expect(result.fieldValues).toEqual({
      advanced: false,
      note: "keep-me",
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
      fieldValues: { name: "Alice" },
      serializedValues: { name: "Alice" },
      serializedFieldValues: { name: "Alice" },
      submitCount: 1,
      error: expect.any(SubmissionAbortedError),
    });
  });

  it("does not mark reports as loading when submit receives an already aborted signal", async () => {
    const submit = vi.fn().mockResolvedValue({ reports: {} });
    const abortController = new AbortController();
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
    });

    form.setValues({ name: "Alice" });
    abortController.abort("already-cancelled");

    await expect(form.submit({ signal: abortController.signal })).rejects.toBeInstanceOf(
      SubmissionAbortedError,
    );

    expect(submit).not.toHaveBeenCalled();
    expect(form.getReport("classifier")?.state.status).toBe("idle");
    expect(form.state.status).toBe("editing");

    await form.submit();
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("does not let stale external abort signals cancel later submissions", async () => {
    let resolveSecondSubmit: ((value: { reports: Record<string, unknown> }) => void) | undefined;
    let startSecondSubmit: (() => void) | undefined;
    const secondSubmitStarted = new Promise<void>((resolve) => {
      startSecondSubmit = resolve;
    });
    const submit = vi
      .fn()
      .mockResolvedValueOnce({ reports: {} })
      .mockImplementationOnce(
        ({ signal }: { signal?: AbortSignal }) =>
          new Promise((resolve, reject) => {
            startSecondSubmit?.();
            signal?.addEventListener(
              "abort",
              () => {
                reject(new Error("second submit aborted"));
              },
              { once: true },
            );

            resolveSecondSubmit = resolve as (value: { reports: Record<string, unknown> }) => void;
          }),
      );
    const staleAbortController = new AbortController();
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
    });

    form.setValues({ name: "Alice" });
    await form.submit({ signal: staleAbortController.signal });

    const secondSubmit = form.submit();
    await secondSubmitStarted;
    staleAbortController.abort("late-stale-abort");
    resolveSecondSubmit?.({ reports: {} });

    await expect(secondSubmit).resolves.toMatchObject({
      values: { name: "Alice" },
    });
    expect(form.state.status).toBe("success");
    expect(submit).toHaveBeenCalledTimes(2);
  });

  it("isolates submit hooks, transport payloads, and returned results from engine state", async () => {
    const inputSeries = [{ field1: "2026-01-01", field2: 10 }];
    const normalizedSeries = [{ field1: new Date("2026-01-01"), field2: 10 }];
    const serializedSeries = [{ field1: "2026-01-01", field2: 10 }];
    const beforeSubmit = vi.fn(({ values }: { values: Record<string, unknown> }) => {
      expect(values).toEqual({ series: normalizedSeries });
      (values.series as { field1: Date; field2: number }[])[0]!.field2 = 20;
    });
    const submit = vi
      .fn()
      .mockImplementation(
        async ({
          values,
          serializedValues,
        }: {
          values: Record<string, unknown>;
          serializedValues: Record<string, unknown>;
        }) => {
          expect(values).toEqual({ series: normalizedSeries });
          expect(serializedValues).toEqual({ series: serializedSeries });
          (values.series as { field1: Date; field2: number }[])[0]!.field2 = 30;
          (serializedValues.series as { field1: string; field2: number }[])[0]!.field2 = 40;

          return { reports: {} };
        },
      );
    const afterSubmit = vi.fn(({ result }: { result: { values: Record<string, unknown> } }) => {
      expect(result.values).toEqual({ series: normalizedSeries });
      (result.values.series as { field1: Date; field2: number }[])[0]!.field2 = 50;
    });

    const form = createForm({
      schema: {
        fields: [
          {
            kind: "series",
            label: "Series",
            field1: { kind: "date", label: "field1", required: true },
            field2: { kind: "number", label: "field2", required: true },
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

    form.setValues({ series: inputSeries });

    const result = await form.submit();

    expect(beforeSubmit).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(afterSubmit).toHaveBeenCalledTimes(1);
    expect(form.getValues()).toEqual({ series: normalizedSeries });
    expect(form.state.values).toEqual({ series: normalizedSeries });
    expect(form.state.lastResult?.values).toEqual({ series: normalizedSeries });
    expect(result.values).toEqual({ series: normalizedSeries });

    (result.values.series as { field1: Date; field2: number }[])[0]!.field2 = 60;

    expect(form.getValues()).toEqual({ series: normalizedSeries });
    expect(form.state.lastResult?.values).toEqual({ series: normalizedSeries });
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
    expect(form.state.submitCount).toBe(0);
    expect(form.state.lastResult).toBeNull();
    expect(form.reports[0]?.state.status).toBe("idle");
  });

  it("clears submit-count driven state on reset", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
            required: true,
            defaultValue: "Initial",
          },
          {
            kind: "text",
            label: "After Submit",
            hiddenWhen: {
              kind: "submit-count",
              gte: 1,
            },
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn().mockResolvedValue({ reports: {} }),
      },
    });

    expect(form.state.submitCount).toBe(0);
    expect(form.getField("after-submit")?.state.visible).toBe(true);

    await form.submit();

    expect(form.state.submitCount).toBe(1);
    expect(form.getField("after-submit")?.state.visible).toBe(false);

    form.reset();

    expect(form.state.submitCount).toBe(0);
    expect(form.getField("after-submit")?.state.visible).toBe(true);
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

  it("applies incremental field and report stream updates before final result", async () => {
    let releaseStream: (() => void) | undefined;

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
            id: "risk",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
        async *stream() {
          yield {
            type: "field-update",
            fieldId: "name",
            value: "Bob",
          } as const;
          yield {
            type: "report-replace",
            reportId: "risk",
            payload: {
              prediction: "streaming",
            },
          } as const;
          await new Promise<void>((resolve) => {
            releaseStream = resolve;
          });
          yield {
            type: "result",
            result: {
              reports: {
                risk: {
                  prediction: "final",
                },
              },
            },
          } as const;
        },
      },
    });

    form.setValues({ name: "Alice" });

    const pending = form.submit();
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(form.getValues()).toEqual({ name: "Bob" });
    expect(form.state.values).toEqual({ name: "Bob" });
    expect(form.getReport("risk")?.state).toMatchObject({
      status: "ready",
      payload: {
        prediction: "streaming",
      },
    });

    releaseStream?.();
    await pending;

    expect(form.getReport("risk")?.state.payload).toEqual({
      prediction: "final",
    });
  });

  it("normalizes explanation schemas and assigns auto-generated ids", () => {
    const registry = createBuiltinRegistry();

    registry.registerExplanation(
      defineExplanationDefinition({
        kind: "shap",
        schema: z
          .object({
            kind: z.literal("shap"),
            id: z.string().optional(),
            label: z.string().optional(),
          })
          .passthrough(),
        transport: () => ({ submit: vi.fn() }),
        describe: () => null,
      }),
    );

    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name" }],
        explanations: [{ kind: "shap", label: "SHAP Values" }, { kind: "shap" }],
      },
      registry,
      transport: { submit: vi.fn() },
    });

    expect(form.explanations).toHaveLength(2);
    expect(Object.isFrozen(form.explanations)).toBe(true);
    expect(form.explanations[0]?.id).toBe("shap-values");
    expect(form.explanations[1]?.id).toBe("shap");
    expect(form.getExplanation("shap-values")).toBe(form.explanations[0]);
    expect(form.getExplanation("shap")).toBe(form.explanations[1]);
    expect(form.getExplanation("missing")).toBeUndefined();
  });

  it("transitions explanation state idle → loading → done and fires afterExplanation hook", async () => {
    const afterExplanation = vi.fn();
    const fetchResult = { importances: { name: 0.9 } };
    const transportSubmit = vi.fn().mockResolvedValue(fetchResult);
    const registry = createBuiltinRegistry();

    registry.registerExplanation(
      defineExplanationDefinition({
        kind: "shap",
        schema: z
          .object({
            kind: z.literal("shap"),
            id: z.string().optional(),
            label: z.string().optional(),
          })
          .passthrough(),
        transport: () => ({ submit: transportSubmit }),
        describe: (_config, ctx) => ({
          component: "shap-renderer",
          props: { status: ctx.state.status },
        }),
      }),
    );

    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name" }],
        explanations: [{ kind: "shap", label: "SHAP" }],
      },
      registry,
      transport: { submit: vi.fn() },
      hooks: { afterExplanation },
    });

    const ctrl = form.explanations[0]!;
    const stateListener = vi.fn();
    ctrl.subscribe(stateListener);

    expect(ctrl.state.status).toBe("idle");
    expect(form.state.explanationStates[ctrl.id]?.status).toBe("idle");

    const fetchRequest = {
      explanationId: ctrl.id,
      values: { name: "Alice" },
      fieldValues: { name: "Alice" },
      serializedValues: { name: "Alice" },
      serializedFieldValues: { name: "Alice" },
      reports: {},
      meta: {},
      raw: {},
    };

    const fetchPromise = ctrl.fetch(fetchRequest);
    expect(ctrl.state.status).toBe("loading");

    await fetchPromise;

    expect(ctrl.state.status).toBe("done");
    expect(ctrl.state.result).toEqual(fetchResult);
    expect(ctrl.state.error).toBeNull();
    expect(form.state.explanationStates[ctrl.id]?.status).toBe("done");

    expect(transportSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        explanationId: ctrl.id,
        values: { name: "Alice" },
        signal: expect.any(AbortSignal),
      }),
    );

    expect(afterExplanation).toHaveBeenCalledWith({
      explanationId: ctrl.id,
      kind: "shap",
      result: fetchResult,
    });

    expect(stateListener).toHaveBeenCalledTimes(2);
  });

  it("transitions explanation state idle → loading → error and fires onExplanationError hook", async () => {
    const onExplanationError = vi.fn();
    const fetchError = new Error("explanation service unavailable");
    const registry = createBuiltinRegistry();

    registry.registerExplanation(
      defineExplanationDefinition({
        kind: "shap",
        schema: z.object({ kind: z.literal("shap"), id: z.string().optional() }).passthrough(),
        transport: () => ({ submit: vi.fn().mockRejectedValue(fetchError) }),
        describe: () => null,
      }),
    );

    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name" }],
        explanations: [{ kind: "shap" }],
      },
      registry,
      transport: { submit: vi.fn() },
      hooks: { onExplanationError },
    });

    const ctrl = form.explanations[0]!;

    await ctrl.fetch({
      explanationId: ctrl.id,
      values: {},
      fieldValues: {},
      serializedValues: {},
      serializedFieldValues: {},
      reports: {},
      meta: {},
      raw: {},
    });

    expect(ctrl.state.status).toBe("error");
    expect(ctrl.state.error).toBe("explanation service unavailable");
    expect(ctrl.state.result).toBeUndefined();

    expect(onExplanationError).toHaveBeenCalledWith({
      explanationId: ctrl.id,
      kind: "shap",
      error: fetchError,
    });
  });

  it("skips fetch when explanation status is not idle (idempotent)", async () => {
    const transportSubmit = vi.fn().mockResolvedValue({ data: 1 });
    const registry = createBuiltinRegistry();

    registry.registerExplanation(
      defineExplanationDefinition({
        kind: "shap",
        schema: z.object({ kind: z.literal("shap"), id: z.string().optional() }).passthrough(),
        transport: () => ({ submit: transportSubmit }),
        describe: () => null,
      }),
    );

    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name" }],
        explanations: [{ kind: "shap" }],
      },
      registry,
      transport: { submit: vi.fn() },
    });

    const ctrl = form.explanations[0]!;
    const fetchRequest = {
      explanationId: ctrl.id,
      values: {},
      fieldValues: {},
      serializedValues: {},
      serializedFieldValues: {},
      reports: {},
      meta: {},
      raw: {},
    };

    const first = ctrl.fetch(fetchRequest);
    expect(ctrl.state.status).toBe("loading");

    // Second call while first is in-flight — should be no-op.
    await ctrl.fetch(fetchRequest);
    expect(transportSubmit).toHaveBeenCalledTimes(1);

    await first;
    expect(ctrl.state.status).toBe("done");

    // Third call after done — should also be no-op.
    await ctrl.fetch(fetchRequest);
    expect(transportSubmit).toHaveBeenCalledTimes(1);
  });

  it("resets all explanation states on form reset", async () => {
    const registry = createBuiltinRegistry();

    registry.registerExplanation(
      defineExplanationDefinition({
        kind: "shap",
        schema: z.object({ kind: z.literal("shap"), id: z.string().optional() }).passthrough(),
        transport: () => ({ submit: vi.fn().mockResolvedValue({ data: 1 }) }),
        describe: () => null,
      }),
    );

    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name", defaultValue: "Initial" }],
        explanations: [{ kind: "shap" }],
      },
      registry,
      transport: { submit: vi.fn().mockResolvedValue({ reports: {} }) },
    });

    const ctrl = form.explanations[0]!;
    await ctrl.fetch({
      explanationId: ctrl.id,
      values: {},
      fieldValues: {},
      serializedValues: {},
      serializedFieldValues: {},
      reports: {},
      meta: {},
      raw: {},
    });

    expect(ctrl.state.status).toBe("done");

    form.reset();

    expect(ctrl.state.status).toBe("idle");
    expect(form.state.explanationStates[ctrl.id]?.status).toBe("idle");
  });

  it("resets explanation states at the start of each new submit", async () => {
    const registry = createBuiltinRegistry();

    registry.registerExplanation(
      defineExplanationDefinition({
        kind: "shap",
        schema: z.object({ kind: z.literal("shap"), id: z.string().optional() }).passthrough(),
        transport: () => ({ submit: vi.fn().mockResolvedValue({ data: 1 }) }),
        describe: () => null,
      }),
    );

    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name", required: true }],
        explanations: [{ kind: "shap" }],
      },
      registry,
      transport: { submit: vi.fn().mockResolvedValue({ reports: {} }) },
    });

    const ctrl = form.explanations[0]!;

    form.setValues({ name: "Alice" });

    // Fetch after first submit.
    await ctrl.fetch({
      explanationId: ctrl.id,
      values: {},
      fieldValues: {},
      serializedValues: {},
      serializedFieldValues: {},
      reports: {},
      meta: {},
      raw: {},
    });
    expect(ctrl.state.status).toBe("done");

    // Second submit resets explanations to idle.
    await form.submit();

    expect(ctrl.state.status).toBe("idle");
  });

  it("executes pipeline without explanations when explanationMode is none", async () => {
    const submitResult = {
      reports: {
        risk: {
          prediction: "low",
        },
      },
      meta: {
        requestId: "abc",
      },
      raw: {
        outputs: [{ prediction: "low" }],
      },
    };
    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name", required: true }],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn().mockResolvedValue(submitResult),
      },
    });

    form.setValues({ name: "Alice" });

    const result = await executeFormPipeline({
      form,
      explanationMode: "none",
    });

    expect(result.submitResult.reports).toEqual(submitResult.reports);
    expect(result.submitResult.meta).toEqual(submitResult.meta);
    expect(result.submitResult.raw).toEqual(submitResult.raw);
    expect(result.explanationResults).toEqual({});
    expect(result.explanationErrors).toEqual({});
    expect(result.artifacts).toEqual({});
  });

  it("executes explanations, preserves partial failures, and derives artifacts", async () => {
    const afterExplanation = vi.fn();
    const onExplanationError = vi.fn();
    const explanationTransport = vi.fn(async ({ explanationId }: { explanationId: string }) => {
      if (explanationId === "shap-error") {
        throw new Error("explanation failed");
      }

      return {
        id: explanationId,
        score: 0.9,
      };
    });
    const registry = createBuiltinRegistry();

    registry.registerExplanation(
      defineExplanationDefinition({
        kind: "shap",
        schema: z
          .object({
            kind: z.literal("shap"),
            id: z.string().optional(),
            label: z.string().optional(),
          })
          .passthrough(),
        transport: () => ({ submit: explanationTransport }),
        describe: () => null,
      }),
    );

    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name", required: true }],
        explanations: [
          { kind: "shap", id: "shap-ok" },
          { kind: "shap", id: "shap-error" },
        ],
      },
      registry,
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: {
            risk: {
              prediction: "high",
            },
          },
          meta: {
            source: "predict",
          },
          raw: {
            outputs: [{ prediction: "high" }],
          },
        }),
      },
      hooks: {
        afterExplanation,
        onExplanationError,
      },
    });

    form.setValues({ name: "Alice" });

    const result = await executeFormPipeline({
      form,
      artifactAdapter: {
        derive({ submitResult, explanationResults, explanationErrors }) {
          return {
            outputs: (submitResult.raw as { outputs: unknown[] }).outputs,
            explainErrors: explanationErrors,
            explanationIds: Object.keys(explanationResults),
          };
        },
      },
    });

    expect(explanationTransport).toHaveBeenCalledTimes(2);
    expect(result.explanationResults).toEqual({
      "shap-ok": {
        id: "shap-ok",
        score: 0.9,
      },
    });
    expect(result.explanationErrors).toEqual({
      "shap-error": "explanation failed",
    });
    expect(result.artifacts).toEqual({
      outputs: [{ prediction: "high" }],
      explainErrors: {
        "shap-error": "explanation failed",
      },
      explanationIds: ["shap-ok"],
    });
    expect(afterExplanation).toHaveBeenCalledWith({
      explanationId: "shap-ok",
      kind: "shap",
      result: {
        id: "shap-ok",
        score: 0.9,
      },
    });
    expect(onExplanationError).toHaveBeenCalledWith({
      explanationId: "shap-error",
      kind: "shap",
      error: expect.any(Error),
    });
  });

  it("rejects pipeline when artifact derivation fails", async () => {
    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name", required: true }],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: {},
          meta: {},
          raw: {},
        }),
      },
    });

    form.setValues({ name: "Alice" });

    await expect(
      executeFormPipeline({
        form,
        artifactAdapter: {
          derive() {
            throw new Error("artifact failed");
          },
        },
      }),
    ).rejects.toThrow("artifact failed");
  });

  it("rejects pipeline when form submit fails", async () => {
    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name", required: true }],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn().mockRejectedValue(new Error("submit failed")),
      },
    });

    form.setValues({ name: "Alice" });

    await expect(executeFormPipeline({ form })).rejects.toBeInstanceOf(SubmitError);
  });

  it("forwards external abort signals into explanation fetches", async () => {
    const registry = createBuiltinRegistry();
    let capturedSignal: AbortSignal | undefined;
    let resolveReady: (() => void) | undefined;

    registry.registerExplanation(
      defineExplanationDefinition({
        kind: "shap",
        schema: z.object({ kind: z.literal("shap"), id: z.string().optional() }).passthrough(),
        transport: () => ({
          submit: vi.fn(
            ({ signal }: { signal?: AbortSignal }) =>
              new Promise((_resolve, reject) => {
                capturedSignal = signal;
                resolveReady?.();
                signal?.addEventListener(
                  "abort",
                  () => {
                    reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
                  },
                  { once: true },
                );
              }),
          ),
        }),
        describe: () => null,
      }),
    );

    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name", required: true }],
        explanations: [{ kind: "shap", id: "shap" }],
      },
      registry,
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: {},
          meta: {},
          raw: {},
        }),
      },
    });
    const ctrl = form.explanations[0]!;
    const abortController = new AbortController();
    const ready = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });

    const pending = ctrl.fetch({
      explanationId: ctrl.id,
      values: {},
      fieldValues: {},
      serializedValues: {},
      serializedFieldValues: {},
      reports: {},
      meta: {},
      raw: {},
      signal: abortController.signal,
    });

    await ready;
    abortController.abort("stop-explanations");
    await pending;

    expect(capturedSignal).toBeDefined();
    expect(capturedSignal?.aborted).toBe(true);
    expect(ctrl.state.status).toBe("idle");
    expect(ctrl.state.result).toBeUndefined();
    expect(ctrl.state.error).toBeNull();
  });

  it("throws RegistryError for duplicate explanation kind registration", () => {
    const registry = createBuiltinRegistry();
    const def = defineExplanationDefinition({
      kind: "shap",
      schema: z.object({ kind: z.literal("shap"), id: z.string().optional() }).passthrough(),
      transport: () => ({ submit: vi.fn() }),
      describe: () => null,
    });

    registry.registerExplanation(def);

    expect(() => registry.registerExplanation(def)).toThrow(RegistryError);
    expect(() => registry.registerExplanation(def)).toThrow(
      'Explanation kind "shap" is already registered.',
    );
  });

  it("supports unregisterField, unregisterReport, and unregisterExplanation", () => {
    const registry = createBuiltinRegistry();

    // Field unregister.
    expect(registry.getField("text")).toBeDefined();
    registry.unregisterField("text");
    expect(registry.getField("text")).toBeUndefined();
    // Silent no-op for non-existent kind.
    expect(() => registry.unregisterField("text")).not.toThrow();

    // Report unregister.
    expect(registry.getReport("classifier")).toBeDefined();
    registry.unregisterReport("classifier");
    expect(registry.getReport("classifier")).toBeUndefined();

    // Explanation: register → unregister → re-register.
    const def = defineExplanationDefinition({
      kind: "shap",
      schema: z.object({ kind: z.literal("shap"), id: z.string().optional() }).passthrough(),
      transport: () => ({ submit: vi.fn() }),
      describe: () => null,
    });

    registry.registerExplanation(def);
    expect(registry.getExplanation("shap")).toBeDefined();
    registry.unregisterExplanation("shap");
    expect(registry.getExplanation("shap")).toBeUndefined();

    // Re-registration after unregister does not throw.
    expect(() => registry.registerExplanation(def)).not.toThrow();
    expect(registry.getExplanation("shap")).toBeDefined();
    expect(registry.listExplanations()).toHaveLength(1);
  });

  it("creates declarative custom fields with generated descriptors", async () => {
    const registry = createBuiltinRegistry();

    registry.registerField(
      defineFieldKind({
        kind: "score",
        schema: z.object({
          kind: z.literal("score"),
          id: z.string().optional(),
          label: z.string(),
          min: z.number().default(0),
          max: z.number().default(100),
          step: z.number().optional(),
          ui: z.record(z.string(), z.unknown()).optional(),
        }),
        value: {
          default: () => 0,
          normalize: (value) => Number(value ?? 0),
          serialize: (value) => value,
        },
        validate: ({ value, config }) =>
          value < config.min || value > config.max ? ["Score out of range."] : [],
        render: {
          widget: "number",
          hints: ({ config }) => ({
            min: config.min,
            max: config.max,
            step: config.step ?? 1,
            unit: "%",
          }),
        },
      }),
    );

    const form = createForm({
      schema: {
        fields: [
          {
            kind: "score",
            label: "Score",
            min: 10,
            max: 20,
            step: 5,
            ui: {
              placeholder: "Pick score",
            },
          },
        ],
      },
      registry,
      transport: { submit: vi.fn() },
    });

    expect(form.fields[0]?.descriptor).toEqual({
      component: "declarative-field",
      meta: expect.objectContaining({
        declarative: true,
        widget: "number",
      }),
      props: expect.objectContaining({
        label: "Score",
        widget: "number",
        min: 10,
        max: 20,
        step: 5,
        unit: "%",
        placeholder: "Pick score",
        value: 0,
      }),
    });

    form.setValues({ score: 30 });
    const validation = await form.validate();

    expect(validation.valid).toBe(false);
    expect(validation.fields.score).toEqual(["Score out of range."]);
  });

  it("creates declarative custom reports with summary and presentation content", async () => {
    const registry = createBuiltinRegistry();

    registry.registerReport(
      defineReportKind({
        kind: "risk-summary",
        schema: z.object({
          kind: z.literal("risk-summary"),
          id: z.string().optional(),
          label: z.string().optional(),
          source: z.string().optional(),
        }),
        resolve: ({ report, result }) => result.reports[report.source],
        render: {
          summary: ({ payload }) => ({
            title: "Risk summary",
            value: (payload as { score: number }).score,
            tone: (payload as { score: number }).score > 0.8 ? "danger" : "neutral",
          }),
          content: ({ payload }) => [
            {
              type: "metric",
              label: "Score",
              value: (payload as { score: number }).score,
            },
            {
              type: "list",
              label: "Drivers",
              items: (payload as { drivers: string[] }).drivers,
            },
          ],
        },
      }),
    );

    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name" }],
        reports: [{ kind: "risk-summary", id: "risk", label: "Risk" }],
      },
      registry,
      transport: {
        submit: vi.fn().mockResolvedValue({
          reports: {
            risk: {
              score: 0.91,
              drivers: ["income", "savings"],
            },
          },
        }),
      },
    });

    form.setValues({ name: "Alice" });
    await form.submit();

    expect(form.reports[0]?.descriptor).toEqual({
      component: "declarative-report",
      meta: expect.objectContaining({
        declarative: true,
      }),
      props: expect.objectContaining({
        label: "Risk",
        summary: expect.objectContaining({
          title: "Risk summary",
          value: 0.91,
          tone: "danger",
        }),
        content: expect.arrayContaining([
          expect.objectContaining({
            type: "metric",
            label: "Score",
            value: 0.91,
          }),
          expect.objectContaining({
            type: "list",
            label: "Drivers",
            items: ["income", "savings"],
          }),
        ]),
      }),
    });
  });

  it("creates declarative custom explanations with generated descriptors and fetch adapters", async () => {
    const explanationTransport = vi.fn().mockResolvedValue({
      top_features: [
        { feature: "income", score: 0.9 },
        { feature: "debt", score: -0.4 },
      ],
    });
    const registry = createBuiltinRegistry();

    registry.registerExplanation(
      defineExplanationKind({
        kind: "shap",
        schema: z.object({
          kind: z.literal("shap"),
          id: z.string().optional(),
          label: z.string().optional(),
        }),
        fetch: ({ explanationId: _explanationId }) => ({
          submit: explanationTransport,
        }),
        render: {
          summary: ({ state }) => ({
            title: "SHAP",
            tone: state.status === "error" ? "danger" : "neutral",
          }),
          content: ({ result }) => ({
            type: "table",
            label: "Feature impact",
            columns: ["feature", "score"],
            rows: ((result as { top_features: Array<{ feature: string; score: number }> })
              .top_features ?? []) as Array<Record<string, unknown>>,
          }),
        },
      }),
    );

    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name" }],
        explanations: [{ kind: "shap", label: "Explain" }],
      },
      registry,
      transport: { submit: vi.fn() },
    });

    const ctrl = form.explanations[0]!;
    await ctrl.fetch({
      explanationId: ctrl.id,
      values: { name: "Alice" },
      fieldValues: { name: "Alice" },
      serializedValues: { name: "Alice" },
      serializedFieldValues: { name: "Alice" },
      reports: {},
      meta: {},
      raw: {},
    });

    expect(explanationTransport).toHaveBeenCalledTimes(1);
    expect(ctrl.descriptor).toEqual({
      component: "declarative-explanation",
      meta: expect.objectContaining({
        declarative: true,
      }),
      props: expect.objectContaining({
        label: "Explain",
        state: "done",
        summary: expect.objectContaining({
          title: "SHAP",
        }),
        content: expect.arrayContaining([
          expect.objectContaining({
            type: "table",
            label: "Feature impact",
          }),
        ]),
      }),
    });
  });

  describe("mapped-category", () => {
    const createMappedCategoryForm = (overrides?: Record<string, unknown>) =>
      createForm({
        schema: {
          fields: [
            {
              kind: "mapped-category",
              label: "Color",
              options: [
                {
                  label: "Rojo",
                  value: "red",
                  mapping: { "is-red": 1, "is-green": 0, "is-blue": 0 },
                },
                {
                  label: "Verde",
                  value: "green",
                  mapping: { "is-red": 0, "is-green": 1, "is-blue": 0 },
                },
                {
                  label: "Azul",
                  value: "blue",
                  mapping: { "is-red": 0, "is-green": 0, "is-blue": 1 },
                },
              ],
            },
            {
              kind: "number",
              label: "is_red",
              hidden: true,
              inactiveFieldPolicy: "include",
            },
            {
              kind: "number",
              label: "is_green",
              hidden: true,
              inactiveFieldPolicy: "include",
            },
            {
              kind: "number",
              label: "is_blue",
              hidden: true,
              inactiveFieldPolicy: "include",
            },
          ],
        },
        registry: createBuiltinRegistry(),
        transport: {
          submit: vi.fn().mockResolvedValue({ raw: {} }),
        },
        ...overrides,
      });

    it("updates subordinate fields when master value changes", () => {
      const form = createMappedCategoryForm();
      const master = form.getField("color")!;

      master.setValue("red");

      expect(form.getField("is-red")!.state.value).toBe(1);
      expect(form.getField("is-green")!.state.value).toBe(0);
      expect(form.getField("is-blue")!.state.value).toBe(0);

      master.setValue("green");

      expect(form.getField("is-red")!.state.value).toBe(0);
      expect(form.getField("is-green")!.state.value).toBe(1);
      expect(form.getField("is-blue")!.state.value).toBe(0);
    });

    it("subordinate fields remain hidden but receive values", () => {
      const form = createMappedCategoryForm();
      form.getField("color")!.setValue("blue");

      const isBlue = form.getField("is-blue")!;
      expect(isBlue.state.value).toBe(1);
      expect(isBlue.state.visible).toBe(false);
    });

    it("supports multiple independent masters", () => {
      const form = createForm({
        schema: {
          fields: [
            {
              kind: "mapped-category",
              label: "Color",
              options: [
                {
                  label: "Rojo",
                  value: "red",
                  mapping: { "is-red": 1, "is-green": 0 },
                },
                {
                  label: "Verde",
                  value: "green",
                  mapping: { "is-red": 0, "is-green": 1 },
                },
              ],
            },
            {
              kind: "mapped-category",
              label: "Size",
              options: [
                {
                  label: "Small",
                  value: "small",
                  mapping: { "is-small": 1, "is-large": 0 },
                },
                {
                  label: "Large",
                  value: "large",
                  mapping: { "is-small": 0, "is-large": 1 },
                },
              ],
            },
            {
              kind: "number",
              label: "is_red",
              hidden: true,
              inactiveFieldPolicy: "include",
            },
            {
              kind: "number",
              label: "is_green",
              hidden: true,
              inactiveFieldPolicy: "include",
            },
            {
              kind: "number",
              label: "is_small",
              hidden: true,
              inactiveFieldPolicy: "include",
            },
            {
              kind: "number",
              label: "is_large",
              hidden: true,
              inactiveFieldPolicy: "include",
            },
          ],
        },
        registry: createBuiltinRegistry(),
        transport: {
          submit: vi.fn().mockResolvedValue({ raw: {} }),
        },
      });

      form.getField("color")!.setValue("red");
      form.getField("size")!.setValue("large");

      expect(form.getField("is-red")!.state.value).toBe(1);
      expect(form.getField("is-green")!.state.value).toBe(0);
      expect(form.getField("is-small")!.state.value).toBe(0);
      expect(form.getField("is-large")!.state.value).toBe(1);
    });

    it("includes subordinate values in submission", async () => {
      const submitMock = vi.fn().mockResolvedValue({ raw: {} });
      const form = createMappedCategoryForm({ transport: { submit: submitMock } });

      form.getField("color")!.setValue("red");
      await form.submit();

      expect(submitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldValues: expect.objectContaining({
            "is-red": 1,
            "is-green": 0,
            "is-blue": 0,
          }),
        }),
      );
      expect(submitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldValues: expect.not.objectContaining({
            color: "red",
          }),
        }),
      );
    });

    it("can opt mapped-category back into submission", async () => {
      const submitMock = vi.fn().mockResolvedValue({ raw: {} });
      const form = createForm({
        schema: {
          fields: [
            {
              kind: "mapped-category",
              label: "Color",
              includeInSubmission: true,
              options: [
                {
                  label: "Rojo",
                  value: "red",
                  mapping: { "is-red": 1, "is-green": 0, "is-blue": 0 },
                },
              ],
            },
            {
              kind: "number",
              label: "is_red",
              hidden: true,
              inactiveFieldPolicy: "include",
            },
            {
              kind: "number",
              label: "is_green",
              hidden: true,
              inactiveFieldPolicy: "include",
            },
            {
              kind: "number",
              label: "is_blue",
              hidden: true,
              inactiveFieldPolicy: "include",
            },
          ],
        },
        registry: createBuiltinRegistry(),
        transport: { submit: submitMock },
      });

      form.getField("color")!.setValue("red");
      await form.submit();

      expect(submitMock).toHaveBeenCalledWith(
        expect.objectContaining({
          fieldValues: expect.objectContaining({
            color: "red",
            "is-red": 1,
            "is-green": 0,
            "is-blue": 0,
          }),
        }),
      );
    });

    it("accepts mapping keys written with underscores", () => {
      const form = createForm({
        schema: {
          fields: [
            {
              kind: "mapped-category",
              label: "Color",
              options: [
                {
                  label: "Rojo",
                  value: "red",
                  mapping: { is_red: 1, is_green: 0, is_blue: 0 },
                },
              ],
            },
            {
              kind: "number",
              label: "is_red",
              hidden: true,
              inactiveFieldPolicy: "include",
            },
            {
              kind: "number",
              label: "is_green",
              hidden: true,
              inactiveFieldPolicy: "include",
            },
            {
              kind: "number",
              label: "is_blue",
              hidden: true,
              inactiveFieldPolicy: "include",
            },
          ],
        },
        registry: createBuiltinRegistry(),
        transport: {
          submit: vi.fn().mockResolvedValue({ raw: {} }),
        },
      });

      form.getField("color")!.setValue("red");

      expect(form.getField("is-red")!.state.value).toBe(1);
      expect(form.getField("is-green")!.state.value).toBe(0);
      expect(form.getField("is-blue")!.state.value).toBe(0);
    });

    it("descriptor uses category-field component", () => {
      const form = createMappedCategoryForm();
      const master = form.getField("color")!;

      expect(master.descriptor.component).toBe("category-field");
      expect(master.descriptor.props).toEqual(
        expect.objectContaining({
          options: [
            { label: "Rojo", value: "red" },
            { label: "Verde", value: "green" },
            { label: "Azul", value: "blue" },
          ],
        }),
      );
    });

    it("does not apply mapping for unknown option value", () => {
      const form = createMappedCategoryForm();
      const master = form.getField("color")!;

      // Set a valid value first
      master.setValue("red");
      expect(form.getField("is-red")!.state.value).toBe(1);

      // Set to null (deselect) — no mapping applied, subordinates keep previous values
      master.setValue(null);
      expect(form.getField("is-red")!.state.value).toBe(1);
    });

    it("throws when mapping references unknown field at form creation", () => {
      expect(() =>
        createForm({
          schema: {
            fields: [
              {
                kind: "mapped-category",
                label: "Color",
                options: [
                  {
                    label: "Rojo",
                    value: "red",
                    mapping: { "nonexistent-field": 1 },
                  },
                ],
              },
            ],
          },
          registry: createBuiltinRegistry(),
          transport: { submit: vi.fn() },
        }),
      ).toThrow(/mapped-category.*nonexistent-field/);
    });

    it("applies mapping via setValues", () => {
      const form = createMappedCategoryForm();

      form.setValues({ color: "blue" });

      expect(form.getField("is-red")!.state.value).toBe(0);
      expect(form.getField("is-green")!.state.value).toBe(0);
      expect(form.getField("is-blue")!.state.value).toBe(1);
    });
  });
});
