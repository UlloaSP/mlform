// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import * as z from "zod";
import {
  EngineError,
  type FieldController,
  ReportPayloadError,
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

  it("treats time-series range restrictions as field validation instead of schema parse failures", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            id: "series",
            kind: "time-series",
            label: "Series",
            minPoints: 3,
            maxPoints: 1,
            minDate: "2026-12-31",
            maxDate: "2026-01-01",
            minValue: 100,
            maxValue: 10,
            defaultValue: [{ timestamp: "2025-06-15", value: 5 }],
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    expect(form.getField("series")?.state.errors).toContain(
      "Minimum number of points cannot exceed maximum number of points.",
    );
    expect(form.getField("series")?.state.errors).toContain(
      "Minimum date cannot be after maximum date.",
    );
    expect(form.getField("series")?.state.errors).toContain(
      "Minimum value cannot exceed maximum value.",
    );
    expect(form.getField("series")?.state.errors).toContain("Minimum number of points is 3.");
    expect(form.getField("series")?.state.errors).toContain("Date must be on or after 2026-12-31.");
    expect(form.getField("series")?.state.errors).toContain("Minimum value is 100.");

    const validation = await form.validate();

    expect(validation.valid).toBe(false);
    expect(validation.fields.series).toContain(
      "Minimum number of points cannot exceed maximum number of points.",
    );
    expect(validation.fields.series).toContain("Minimum date cannot be after maximum date.");
    expect(validation.fields.series).toContain("Minimum value cannot exceed maximum value.");
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

  it("routes submissions to named transport backends", async () => {
    const localSubmit = vi.fn().mockResolvedValue({ reports: {} });
    const remoteSubmit = vi.fn().mockResolvedValue({
      reports: {
        classifier: { prediction: "remote" },
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
            kind: "classifier",
            id: "classifier",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transports: {
        local: { submit: localSubmit },
        remote: { submit: remoteSubmit },
      },
      defaultBackend: "local",
    });

    form.setValues({ name: "Alice" });

    await expect(form.submit({ backend: "missing" })).rejects.toThrow(
      'Unknown transport backend "missing".',
    );
    expect(localSubmit).not.toHaveBeenCalled();
    expect(remoteSubmit).not.toHaveBeenCalled();

    const result = await form.submit({ backend: "remote" });

    expect(localSubmit).not.toHaveBeenCalled();
    expect(remoteSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        backend: "remote",
        values: { name: "Alice" },
      }),
    );
    expect(result.backend).toBe("remote");
  });

  it("rejects backend selection for single-transport forms", async () => {
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
    });

    form.setValues({ name: "Alice" });

    await expect(form.submit({ backend: "remote" })).rejects.toThrow(
      'Transport backend "remote" cannot be selected for a single-transport form.',
    );
    expect(submit).not.toHaveBeenCalled();
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
