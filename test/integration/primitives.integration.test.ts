// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import {
  ValidationError,
  createBuiltinRegistry,
  createForm,
  type FieldController,
  type FieldDefinition,
} from "@/engine";
import { PrimitiveFormElement } from "@/primitives/components/form-root";
import { createPrimitiveRegistry, mountForm } from "@/primitives";

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
};

const getShadow = (element: Element | null): ShadowRoot => {
  if (!(element instanceof HTMLElement) || !element.shadowRoot) {
    throw new Error("Expected element with shadow root.");
  }

  return element.shadowRoot;
};

const getFieldControlHost = (host: HTMLElement, index: number): HTMLElement => {
  const fieldFrame = getShadow(host).querySelectorAll("mlf-field-frame").item(index) as HTMLElement;
  const fieldShadow = getShadow(fieldFrame);
  const renderer = fieldShadow.querySelector(
    "mlf-text-field, mlf-number-field, mlf-boolean-field, mlf-category-field, mlf-date-field, mlf-time-series-field",
  );
  return getShadow(renderer).querySelector("[aria-label]") as HTMLElement;
};

describe("primitives", () => {
  it("rejects mounting into a non-empty container unless replacement is explicit", () => {
    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name" }],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    const container = document.createElement("div");
    container.append(document.createElement("span"));

    expect(() => mountForm(container, form)).toThrow(
      'Mount into an empty container or pass `containerStrategy: "replace"`.',
    );
  });

  it("restores replaced container content on unmount when replacement is explicit", () => {
    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Name" }],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    const container = document.createElement("div");
    const placeholder = document.createElement("p");
    placeholder.textContent = "placeholder";
    container.append(placeholder);

    const mounted = mountForm(container, form, {
      containerStrategy: "replace",
    });

    expect(container.firstElementChild).toBe(mounted.host);

    mounted.unmount();

    expect(container.childElementCount).toBe(1);
    expect(container.firstElementChild).toBe(placeholder);
  });

  it("shows visible field feedback after submit when a required field is still empty", async () => {
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
      transport: {
        submit: vi.fn(),
      },
    });

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form, {
      submitLabel: "Run",
    });
    const errorListener = vi.fn();

    mounted.host.addEventListener("mlf-submit-error", (event) => {
      errorListener((event as CustomEvent<{ error: unknown }>).detail.error);
    });

    await flush();

    const fieldFrame = getShadow(mounted.host).querySelector("mlf-field-frame");
    expect(getShadow(fieldFrame).textContent).not.toContain("Value ready.");

    const submitHost = getShadow(mounted.host).querySelector("mlf-submit-button");
    const submitButton = getShadow(submitHost).querySelector("button");
    submitButton?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));

    await flush();
    await flush();

    expect(form.getField("name")?.state.errors).toEqual(["This field is required."]);
    expect(errorListener).toHaveBeenCalledTimes(1);
    expect(errorListener.mock.calls[0]?.[0]).toBeInstanceOf(ValidationError);

    expect(getShadow(fieldFrame).textContent).toContain("This field is required.");
    const renderer = getShadow(fieldFrame).querySelector("mlf-text-field");
    const rendererShadow = getShadow(renderer);
    const textInput = rendererShadow.querySelector("input");
    const describedBy = textInput?.getAttribute("aria-describedby");
    expect(textInput?.getAttribute("aria-invalid")).toBe("true");
    expect(describedBy).toBeTruthy();
    expect(
      rendererShadow.querySelector(`#${describedBy?.split(" ").at(-1) ?? ""}`)?.textContent,
    ).toContain("This field is required.");

    mounted.unmount();
    container.remove();
  });

  it("keeps form-level errors visible in split layout when the report pane is hidden", async () => {
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
          form: ["Form-level warning."],
        }),
      ],
    });

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form, {
      layout: "split",
      reportPane: "hidden",
    });

    await flush();

    await form.validate();
    await flush();
    const formErrors = getShadow(mounted.host).querySelector("mlf-form-errors");
    expect(getShadow(formErrors).textContent).toContain("Form errors");
    expect(getShadow(formErrors).textContent).toContain("Form-level warning.");

    mounted.unmount();
    container.remove();
  });

  it("shows visible feedback when clearing previously valid built-in values back to empty", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            id: "name",
            kind: "text",
            label: "Name",
            required: true,
          },
          {
            id: "age",
            kind: "number",
            label: "Age",
            required: true,
          },
          {
            id: "tier",
            kind: "category",
            label: "Tier",
            required: true,
            options: ["Internal", "External"],
          },
          {
            id: "launch-date",
            kind: "date",
            label: "Launch date",
            required: true,
          },
          {
            id: "history",
            kind: "time-series",
            label: "History",
            required: true,
          },
        ],
      },
      registry: createBuiltinRegistry(),
      initialValues: {
        name: "Alice",
        age: 24,
        tier: "Internal",
        "launch-date": "2026-07-10",
        history: [{ timestamp: "2026-07-10", value: 10 }],
      },
      transport: {
        submit: vi.fn(),
      },
    });

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form);

    await flush();

    const textInput = getFieldControlHost(mounted.host, 0) as HTMLInputElement;
    textInput.value = "";
    textInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    textInput.dispatchEvent(new Event("blur", { bubbles: true, composed: true }));

    const numberInput = getFieldControlHost(mounted.host, 1) as HTMLInputElement;
    numberInput.value = "";
    numberInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    numberInput.dispatchEvent(new Event("blur", { bubbles: true, composed: true }));

    const categorySelect = getFieldControlHost(mounted.host, 2) as HTMLSelectElement;
    categorySelect.value = "";
    categorySelect.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    categorySelect.dispatchEvent(new Event("blur", { bubbles: true, composed: true }));

    const dateInput = getFieldControlHost(mounted.host, 3) as HTMLInputElement;
    dateInput.value = "";
    dateInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    dateInput.dispatchEvent(new Event("blur", { bubbles: true, composed: true }));

    const timeSeriesFieldFrame = getShadow(mounted.host)
      .querySelectorAll("mlf-field-frame")
      .item(4) as HTMLElement;
    const timeSeriesRenderer = getShadow(timeSeriesFieldFrame).querySelector(
      "mlf-time-series-field",
    ) as HTMLElement;
    const removeButton = getShadow(timeSeriesRenderer).querySelector(
      'button[aria-label^="Remove point"]',
    ) as HTMLButtonElement;
    removeButton.click();

    await flush();
    await flush();

    const fieldFrames = getShadow(mounted.host).querySelectorAll("mlf-field-frame");
    for (const fieldFrame of fieldFrames) {
      expect(getShadow(fieldFrame as HTMLElement).textContent).toContain("This field is required.");
    }

    mounted.unmount();
    container.remove();
  });

  it("shows visible feedback for non-numeric text entered into number fields", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "number",
            label: "Training epochs",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form);

    await flush();

    const numberInput = getFieldControlHost(mounted.host, 0) as HTMLInputElement;
    numberInput.value = "dfsfdsfdfdsfdsf";
    numberInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));

    await flush();

    expect(form.getField("training-epochs")?.state.value).toBe("dfsfdsfdfdsfdsf");

    const fieldFrame = getShadow(mounted.host).querySelector("mlf-field-frame") as HTMLElement;
    expect(getShadow(fieldFrame).textContent).toContain("Value must be a valid number.");
    expect(numberInput.getAttribute("aria-invalid")).toBe("true");

    mounted.unmount();
    container.remove();
  });

  it("suppresses number validation errors for partial drafts until blur", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "number",
            label: "Training epochs",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form);

    await flush();

    const numberInput = getFieldControlHost(mounted.host, 0) as HTMLInputElement;
    numberInput.value = "-";
    numberInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));

    await flush();

    expect(numberInput.value).toBe("-");
    expect(form.getField("training-epochs")?.state.errors).toEqual([]);

    const fieldFrame = getShadow(mounted.host).querySelector("mlf-field-frame") as HTMLElement;
    expect(getShadow(fieldFrame).textContent).not.toContain("Value must be a valid number.");

    numberInput.dispatchEvent(new Event("blur", { bubbles: true, composed: true }));
    await flush();
    await flush();

    expect(form.getField("training-epochs")?.state.errors).toContain(
      "Value must be a valid number.",
    );

    mounted.unmount();
    container.remove();
  });

  it("shows built-in min and max validation feedback while editing constrained fields", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            id: "username",
            kind: "text",
            label: "Username",
            minLength: 5,
            pattern: "^[a-z]+$",
          },
          {
            id: "epochs",
            kind: "number",
            label: "Training epochs",
            min: 10,
            max: 20,
          },
          {
            id: "release-date",
            kind: "date",
            label: "Release date",
            min: "2026-01-10",
            max: "2026-01-20",
          },
          {
            id: "history",
            kind: "time-series",
            label: "History",
            minPoints: 2,
            minDate: "2026-01-10",
            maxDate: "2026-01-20",
            minValue: 100,
            maxValue: 200,
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form);

    await flush();

    const textInput = getFieldControlHost(mounted.host, 0) as HTMLInputElement;
    textInput.value = "A1";
    textInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));

    const numberInput = getFieldControlHost(mounted.host, 1) as HTMLInputElement;
    numberInput.value = "5";
    numberInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));

    const dateInput = getFieldControlHost(mounted.host, 2) as HTMLInputElement;
    dateInput.value = "2026-01-05";
    dateInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));

    const timeSeriesFieldFrame = getShadow(mounted.host)
      .querySelectorAll("mlf-field-frame")
      .item(3) as HTMLElement;
    const timeSeriesRenderer = getShadow(timeSeriesFieldFrame).querySelector(
      "mlf-time-series-field",
    ) as HTMLElement;
    const timeSeriesShadow = getShadow(timeSeriesRenderer);
    const addButton = timeSeriesShadow.querySelector(
      'button[aria-label="Add point"]',
    ) as HTMLButtonElement;
    addButton.click();
    await flush();

    const timestampInput = timeSeriesShadow.querySelector('input[type="date"]') as HTMLInputElement;
    timestampInput.value = "2026-01-05";
    timestampInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));

    const valueInput = timeSeriesShadow.querySelector(
      'input[inputmode="decimal"]',
    ) as HTMLInputElement;
    valueInput.value = "50";
    valueInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    valueInput.dispatchEvent(new Event("blur", { bubbles: true, composed: true }));

    await flush();
    await flush();

    expect(form.getField("username")?.state.errors).toContain("Minimum length is 5 characters.");
    expect(form.getField("username")?.state.errors).toContain(
      "Value does not match the expected pattern.",
    );
    expect(form.getField("epochs")?.state.errors).toContain("Minimum value is 10.");
    expect(form.getField("release-date")?.state.errors).toContain(
      "Date must be on or after 2026-01-10.",
    );
    expect(form.getField("history")?.state.errors).toContain("Minimum number of points is 2.");
    expect(form.getField("history")?.state.errors).toContain(
      "Date must be on or after 2026-01-10.",
    );
    expect(form.getField("history")?.state.errors).toContain("Minimum value is 100.");

    const fieldFrames = getShadow(mounted.host).querySelectorAll("mlf-field-frame");
    expect(getShadow(fieldFrames.item(0)).textContent).toContain("Minimum length is 5 characters.");
    expect(getShadow(fieldFrames.item(1)).textContent).toContain("Minimum value is 10.");
    expect(getShadow(fieldFrames.item(2)).textContent).toContain(
      "Date must be on or after 2026-01-10.",
    );
    expect(getShadow(fieldFrames.item(3)).textContent).toContain("Minimum number of points is 2.");

    mounted.unmount();
    container.remove();
  });

  it("treats explicit default values as introduced and shows success styling immediately", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "text",
            label: "Name",
            defaultValue: "Alice",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form);

    await flush();

    const fieldFrame = getShadow(mounted.host).querySelector("mlf-field-frame");
    expect(getShadow(fieldFrame).textContent).toContain("Text recorded (5 characters).");

    mounted.unmount();
    container.remove();
  });

  it("renders the selected category option when the engine already has an initial valid value", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "category",
            label: "Tier",
            options: ["Internal", "External"],
            defaultValue: "Internal",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form);

    await flush();

    const fieldFrame = getShadow(mounted.host).querySelector("mlf-field-frame");
    const renderer = getShadow(fieldFrame).querySelector("mlf-category-field") as HTMLElement;
    const select = getShadow(renderer).querySelector("select") as HTMLSelectElement;

    expect(select.value).toBe("Internal");
    expect(select.selectedOptions[0]?.textContent).toContain("Internal");
    expect(getShadow(fieldFrame).textContent).toContain("Category selected: Internal.");

    mounted.unmount();
    container.remove();
  });

  it("does not show category success feedback when the current value does not match any available option", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "category",
            label: "Tier",
            options: ["Internal", "External"],
            defaultValue: "Ghost",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form);

    await flush();

    const fieldFrame = getShadow(mounted.host).querySelector("mlf-field-frame");
    const renderer = getShadow(fieldFrame).querySelector("mlf-category-field") as HTMLElement;
    const select = getShadow(renderer).querySelector("select") as HTMLSelectElement;

    expect(select.value).toBe("");
    expect(select.selectedOptions[0]?.textContent).toContain("Select");
    expect(getShadow(fieldFrame).textContent).not.toContain("Category selected:");

    mounted.unmount();
    container.remove();
  });

  it("shows success feedback for date fields when a real date value is already present", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "date",
            label: "Launch date",
            defaultValue: "2026-07-10",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form);

    await flush();

    const fieldFrame = getShadow(mounted.host).querySelector("mlf-field-frame");
    expect(getShadow(fieldFrame).textContent).toContain("Selected date: 2026-07-10.");

    mounted.unmount();
    container.remove();
  });

  it("renders legacy-compatible number placeholders and date steps in the default primitives", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "number",
            label: "Revenue",
            placeholder: "Enter amount",
          },
          {
            kind: "date",
            label: "Billing cycle",
            step: 7,
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form);

    await flush();

    const fieldFrames = getShadow(mounted.host).querySelectorAll("mlf-field-frame");

    const numberRenderer = getShadow(fieldFrames.item(0)).querySelector(
      "mlf-number-field",
    ) as HTMLElement;
    const numberInput = getShadow(numberRenderer).querySelector("input") as HTMLInputElement;
    expect(numberInput.placeholder).toBe("Enter amount");

    const dateRenderer = getShadow(fieldFrames.item(1)).querySelector(
      "mlf-date-field",
    ) as HTMLElement;
    const dateInput = getShadow(dateRenderer).querySelector("input") as HTMLInputElement;
    expect(dateInput.step).toBe("7");

    mounted.unmount();
    container.remove();
  });

  it("accepts mount-time primitive text overrides", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "category",
            label: "Tier",
            options: ["Internal", "External"],
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form, {
      text: {
        formEyebrow: "Survey",
        categoryPlaceholder: "Choose tier",
      },
    });

    await flush();

    expect(getShadow(mounted.host).textContent).toContain("Survey");

    const fieldFrame = getShadow(mounted.host).querySelector("mlf-field-frame") as HTMLElement;
    const renderer = getShadow(fieldFrame).querySelector("mlf-category-field") as HTMLElement;
    const select = getShadow(renderer).querySelector("select") as HTMLSelectElement;
    expect(select.options[0]?.textContent).toContain("Choose tier");

    mounted.unmount();
    container.remove();
  });

  it("shows success feedback for boolean fields when false is an explicit configured value", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "boolean",
            label: "Enabled",
            defaultValue: false,
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form);

    await flush();

    const fieldFrame = getShadow(mounted.host).querySelector("mlf-field-frame");
    expect(getShadow(fieldFrame).textContent).toContain("Selection recorded: False.");

    mounted.unmount();
    container.remove();
  });

  it("renders custom boolean labels from the engine descriptor", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "boolean",
            label: "Enabled",
            defaultValue: false,
            trueLabel: "On",
            falseLabel: "Off",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form);

    await flush();

    const fieldFrame = getShadow(mounted.host).querySelector("mlf-field-frame") as HTMLElement;
    const renderer = getShadow(fieldFrame).querySelector("mlf-boolean-field") as HTMLElement;
    const labels = getShadow(renderer).querySelectorAll("label.opt");

    expect(labels[0]?.textContent).toContain("On");
    expect(labels[1]?.textContent).toContain("Off");
    expect(getShadow(fieldFrame).textContent).toContain("Selection recorded: Off.");

    mounted.unmount();
    container.remove();
  });

  it("renders and edits time-series fields through the default primitive registry", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "time-series",
            label: "Demand history",
            unit: "MW",
            defaultValue: [
              { timestamp: "2026-07-10", value: 10 },
              { timestamp: "2026-07-11", value: 12 },
            ],
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form);

    await flush();

    const fieldFrame = getShadow(mounted.host).querySelector("mlf-field-frame") as HTMLElement;
    expect(getShadow(fieldFrame).textContent).toContain("Series ready (2 points).");

    const renderer = getShadow(fieldFrame).querySelector("mlf-time-series-field") as HTMLElement;
    const rendererShadow = getShadow(renderer);
    const valueInputs = rendererShadow.querySelectorAll(
      'input[inputmode="decimal"]',
    ) as NodeListOf<HTMLInputElement>;

    valueInputs[1].value = "14.5";
    valueInputs[1].dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    valueInputs[1].dispatchEvent(new Event("blur", { bubbles: true, composed: true }));
    await flush();

    expect(form.getField("demand-history")?.state.value).toEqual([
      { timestamp: new Date("2026-07-10"), value: 10 },
      { timestamp: new Date("2026-07-11"), value: 14.5 },
    ]);

    const addButton = rendererShadow.querySelector(
      'button[aria-label="Add point"]',
    ) as HTMLButtonElement;
    addButton.click();
    await flush();

    expect(form.getField("demand-history")?.state.value).toHaveLength(3);
    expect(rendererShadow.textContent).toContain("MW");

    const removeButtons = rendererShadow.querySelectorAll(
      'button[aria-label^="Remove point"]',
    ) as NodeListOf<HTMLButtonElement>;
    removeButtons[0].click();
    await flush();

    expect(form.getField("demand-history")?.state.value).toHaveLength(2);

    mounted.unmount();
    container.remove();
  });

  it("does not commit identical time-series rows twice on blur after a value edit", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            kind: "time-series",
            label: "Demand history",
            defaultValue: [{ timestamp: "2026-07-10", value: 10 }],
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form);

    await flush();

    const field = form.getField("demand-history");
    if (!field) {
      throw new Error("Expected time-series field.");
    }
    const setValueSpy = vi.spyOn(field, "setValue");

    const fieldFrame = getShadow(mounted.host).querySelector("mlf-field-frame") as HTMLElement;
    const renderer = getShadow(fieldFrame).querySelector("mlf-time-series-field") as HTMLElement;
    const valueInput = getShadow(renderer).querySelector(
      'input[inputmode="decimal"]',
    ) as HTMLInputElement;

    valueInput.value = "12";
    valueInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    valueInput.dispatchEvent(new Event("blur", { bubbles: true, composed: true }));

    await flush();
    await flush();

    expect(setValueSpy).toHaveBeenCalledTimes(1);

    mounted.unmount();
    container.remove();
  });

  it("binds built-in controls to the engine, emits success events, and renders reports after submit", async () => {
    const submit = vi.fn().mockResolvedValue({
      reports: {
        risk: {
          prediction: "high",
          labels: ["low", "high"],
          probabilities: [0.1, 0.9],
        },
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
            kind: "number",
            label: "Age",
            required: true,
            min: 18,
            unit: "years",
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
      transport: { submit },
    });

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form, {
      layout: "split",
      submitLabel: "Predict",
    });
    const startListener = vi.fn();
    const successListener = vi.fn();

    mounted.host.addEventListener("mlf-submit-start", startListener);
    mounted.host.addEventListener("mlf-submit-success", successListener);

    await flush();
    expect(getShadow(mounted.host).querySelector("mlf-report-frame")).toBeNull();
    const splitShell = getShadow(mounted.host).querySelector(".split-shell");
    const leftSection = getShadow(mounted.host).querySelector(".left-section");
    const rightSection = getShadow(mounted.host).querySelector(".right-section");
    const formInputs = getShadow(mounted.host).querySelector(".form-inputs.scroll-y");
    const resultsArea = getShadow(mounted.host).querySelector(".results-area.scroll-y");
    const formActions = getShadow(mounted.host).querySelector(".form-actions");

    expect(splitShell).not.toBeNull();
    expect(leftSection).not.toBeNull();
    expect(rightSection).not.toBeNull();
    expect(formInputs).not.toBeNull();
    expect(resultsArea).not.toBeNull();
    expect(formActions?.contains(formInputs as Node)).toBe(false);

    const textInput = getFieldControlHost(mounted.host, 0) as HTMLInputElement;
    textInput.value = "Alice";
    textInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));

    const numberInput = getFieldControlHost(mounted.host, 1) as HTMLInputElement;
    numberInput.value = "34";
    numberInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));

    await flush();

    const textFieldFrame = getShadow(mounted.host).querySelectorAll("mlf-field-frame").item(0);
    expect(getShadow(textFieldFrame).textContent).toContain("Text recorded (5 characters).");
    const numberRenderer = getShadow(mounted.host)
      .querySelectorAll("mlf-field-frame")
      .item(1)
      ?.shadowRoot?.querySelector("mlf-number-field") as HTMLElement;
    expect(getShadow(numberRenderer).textContent).toContain("years");

    const submitHost = getShadow(mounted.host).querySelector("mlf-submit-button");
    const submitButton = getShadow(submitHost).querySelector("button");
    submitButton?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));

    await flush();
    await flush();

    expect(submit).toHaveBeenCalledTimes(1);
    expect(form.state.status).toBe("success");
    expect(startListener).toHaveBeenCalledTimes(1);
    expect(successListener).toHaveBeenCalledTimes(1);

    const reportFrame = getShadow(mounted.host).querySelector("mlf-report-frame");
    const reportRenderer = getShadow(reportFrame).querySelector("mlf-classifier-report");
    const reportShadow = getShadow(reportRenderer);
    expect(reportShadow.textContent).toContain("high");
    expect(reportShadow.textContent).toContain("90.0%");

    mounted.unmount();
    container.remove();
  });

  it("sizes the split host to the mounted container instead of imposing its own viewport height", async () => {
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
        submit: vi.fn(),
      },
    });

    const container = document.createElement("div");
    container.style.width = "640px";
    container.style.height = "420px";
    document.body.append(container);
    const mounted = mountForm(container, form, {
      layout: "split",
      reportPane: "always",
    });

    await flush();

    const cssText = PrimitiveFormElement.styles.toString();

    expect(cssText).toContain("inline-size: 100%;");
    expect(cssText).toContain("block-size: 100%;");
    expect(cssText).not.toContain("--mlf-shell-split-height");

    mounted.unmount();
    container.remove();
  });

  it("renders falsy report payloads like 0 instead of treating them as empty", async () => {
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
        submit: vi.fn().mockResolvedValue({
          reports: {
            score: 0,
          },
        }),
      },
    });

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form);

    await flush();

    const textInput = getFieldControlHost(mounted.host, 0) as HTMLInputElement;
    textInput.value = "Alice";
    textInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    await flush();

    const submitHost = getShadow(mounted.host).querySelector("mlf-submit-button");
    const submitButton = getShadow(submitHost).querySelector("button");
    submitButton?.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));

    await flush();
    await flush();

    const reportFrame = getShadow(mounted.host).querySelector("mlf-report-frame");
    const reportRenderer = getShadow(reportFrame).querySelector("mlf-regressor-report");
    expect(getShadow(reportRenderer).textContent).toContain("0.00");

    mounted.unmount();
    container.remove();
  });

  it("does not request a root update for repeated keystrokes that leave render state unchanged", async () => {
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

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form);

    await flush();

    const host = mounted.host as PrimitiveFormElement;
    const originalRequestUpdate = host.requestUpdate.bind(host);
    let requestCount = 0;
    (
      host as PrimitiveFormElement & {
        requestUpdate: PrimitiveFormElement["requestUpdate"];
      }
    ).requestUpdate = ((...args: Parameters<PrimitiveFormElement["requestUpdate"]>) => {
      requestCount += 1;
      return originalRequestUpdate(...args);
    }) as PrimitiveFormElement["requestUpdate"];

    const textInput = getFieldControlHost(mounted.host, 0) as HTMLInputElement;
    textInput.value = "A";
    textInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    await flush();

    expect(requestCount).toBeGreaterThan(0);

    requestCount = 0;
    textInput.value = "Al";
    textInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    await flush();

    expect(requestCount).toBe(0);

    mounted.unmount();
    container.remove();
  });

  it("keeps field renderer context stable across frame-only rerenders", async () => {
    if (!customElements.get("test-context-probe-field")) {
      class TestContextProbeFieldElement extends HTMLElement {
        #context: unknown;
        contextSetCount = 0;

        set context(value: unknown) {
          if (this.#context !== value) {
            this.contextSetCount += 1;
            this.#context = value;
          }
        }

        get context(): unknown {
          return this.#context;
        }
      }

      customElements.define("test-context-probe-field", TestContextProbeFieldElement);
    }

    const registry = createBuiltinRegistry();

    registry.registerField({
      kind: "context-probe",
      schema: {
        parse(input: unknown) {
          return input as {
            kind: "context-probe";
            label: string;
            description?: string;
            id?: string;
          };
        },
      } as never,
      normalizeValue(value) {
        return typeof value === "string" ? value : "";
      },
      describe(config, context) {
        return {
          component: "context-probe-field",
          props: {
            id: config.id,
            label: config.label,
            description: config.description ?? "",
            value: context.state.value,
          },
        };
      },
    } satisfies FieldDefinition);

    const form = createForm({
      schema: {
        fields: [
          {
            kind: "context-probe",
            label: "Probe",
            description: "Toggle me",
          },
        ],
      },
      registry,
      transport: {
        submit: vi.fn(),
      },
    });

    const primitiveRegistry = createPrimitiveRegistry().registerField(
      "context-probe-field",
      "test-context-probe-field",
    );

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form, {
      registry: primitiveRegistry,
      reportPane: "hidden",
    });

    await flush();

    const fieldFrame = getShadow(mounted.host).querySelector("mlf-field-frame") as HTMLElement;
    const probe = getShadow(fieldFrame).querySelector("test-context-probe-field") as HTMLElement & {
      contextSetCount: number;
    };
    const helpButton = getShadow(fieldFrame).querySelector("button.help-btn") as HTMLButtonElement;
    const initialContextSetCount = probe.contextSetCount;

    expect(initialContextSetCount).toBeGreaterThan(0);

    helpButton.click();
    await flush();
    helpButton.click();
    await flush();

    expect(probe.contextSetCount).toBe(initialContextSetCount);

    mounted.unmount();
    container.remove();
  });

  it("supports custom primitive renderer mappings and unmounts cleanly", async () => {
    if (!customElements.get("test-probe-field")) {
      class TestProbeFieldElement extends HTMLElement {
        accessor controller: FieldController | undefined;

        connectedCallback(): void {
          this.textContent = "probe-renderer";
        }
      }

      customElements.define("test-probe-field", TestProbeFieldElement);
    }

    const registry = createBuiltinRegistry();

    registry.registerField({
      kind: "probe",
      schema: {
        parse(input: unknown) {
          return input as {
            kind: "probe";
            label: string;
            id?: string;
          };
        },
      } as never,
      normalizeValue(value) {
        return typeof value === "string" ? value : "";
      },
      describe(config, context) {
        return {
          component: "probe-field",
          props: {
            id: config.id,
            label: config.label,
            value: context.state.value,
          },
        };
      },
    } satisfies FieldDefinition);

    const form = createForm({
      schema: {
        fields: [
          {
            kind: "probe",
            label: "Probe",
          },
        ],
      },
      registry,
      transport: {
        submit: vi.fn(),
      },
    });

    const primitiveRegistry = createPrimitiveRegistry().registerField(
      "probe-field",
      "test-probe-field",
    );

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form, {
      registry: primitiveRegistry,
      reportPane: "hidden",
    });

    await flush();

    const fieldFrame = getShadow(mounted.host).querySelector("mlf-field-frame");
    expect(getShadow(fieldFrame).querySelector("test-probe-field")).not.toBeNull();

    mounted.unmount();

    expect(container.childElementCount).toBe(0);
    container.remove();
  });

  it("rejects invalid custom element names in the primitive registry", () => {
    expect(() => {
      createPrimitiveRegistry().registerField("broken", "div");
    }).toThrow(TypeError);

    expect(() => {
      createPrimitiveRegistry().registerReport("broken", "BadTag");
    }).toThrow(TypeError);
  });

  it("collapses hidden fields from the layout instead of leaving empty frames behind", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            id: "advanced",
            kind: "boolean",
            label: "Advanced",
          },
          {
            id: "secret",
            kind: "text",
            label: "Secret",
            hiddenWhen: ({ values }) => values.advanced !== true,
          },
        ],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form);

    await flush();

    expect(getShadow(mounted.host).querySelectorAll("mlf-field-frame")).toHaveLength(1);

    form.setValues({ advanced: true });
    await flush();

    expect(getShadow(mounted.host).querySelectorAll("mlf-field-frame")).toHaveLength(2);

    form.setValues({ advanced: false });
    await flush();

    expect(getShadow(mounted.host).querySelectorAll("mlf-field-frame")).toHaveLength(1);

    mounted.unmount();
    container.remove();
  });

  it("prevents read-only category and boolean primitives from mutating engine state", async () => {
    const form = createForm({
      schema: {
        fields: [
          {
            id: "mode",
            kind: "text",
            label: "Mode",
          },
          {
            id: "kind",
            kind: "category",
            label: "Kind",
            options: ["alpha", "beta"],
            readOnlyWhen: ({ values }) => values.mode === "lock",
          },
          {
            id: "consent",
            kind: "boolean",
            label: "Consent",
            readOnlyWhen: ({ values }) => values.mode === "lock",
          },
        ],
      },
      registry: createBuiltinRegistry(),
      initialValues: {
        mode: "lock",
        kind: "alpha",
        consent: true,
      },
      transport: {
        submit: vi.fn(),
      },
    });

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form);

    await flush();

    const fieldFrames = getShadow(mounted.host).querySelectorAll("mlf-field-frame");

    const categoryRenderer = getShadow(fieldFrames.item(1)).querySelector(
      "mlf-category-field",
    ) as HTMLElement;
    const categorySelect = getShadow(categoryRenderer).querySelector("select") as HTMLSelectElement;
    expect(categorySelect.disabled).toBe(true);

    categorySelect.value = "beta";
    categorySelect.dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    await flush();

    expect(form.getField("kind")?.state.value).toBe("alpha");

    const booleanRenderer = getShadow(fieldFrames.item(2)).querySelector(
      "mlf-boolean-field",
    ) as HTMLElement;
    const booleanRadios = getShadow(booleanRenderer).querySelectorAll(
      'input[type="radio"]',
    ) as NodeListOf<HTMLInputElement>;
    expect(booleanRadios[0]?.disabled).toBe(true);
    expect(booleanRadios[1]?.disabled).toBe(true);

    booleanRadios[1].checked = true;
    booleanRadios[1].dispatchEvent(new Event("change", { bubbles: true, composed: true }));
    await flush();

    expect(form.getField("consent")?.state.value).toBe(true);

    mounted.unmount();
    container.remove();
  });
});
