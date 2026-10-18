import type { MountedForm } from "mlform/kit";
import type { FormViewController, FormViewSnapshot, FormLayoutConfig } from "mlform/view";
import type { DesignSystemConfig } from "mlform/design";
import type { ClinicalDemoConfig } from "./config.ts";
import { mountForm } from "mlform/kit";
import { attachDesignSystem } from "mlform/design";
import "./styles.css";

export const mountClinicalDemo = (
  container: HTMLElement,
  config: ClinicalDemoConfig,
  designSystem: DesignSystemConfig,
) => {
  const page = document.createElement("div");
  page.className = `clinical-page ${config.className}`;
  page.innerHTML = config.shell;
  container.replaceChildren(page);
  page.dataset.mode = designSystem.mode ?? "auto";
  const design = attachDesignSystem(page, { config: designSystem });
  const select = page.querySelector<HTMLSelectElement>('[data-role="example-select"]')!;
  select.replaceChildren(
    new Option(config.examplePlaceholder, ""),
    ...config.examples.map(({ id, label }) => new Option(label, id)),
  );
  let view: FormViewController;
  let mounted: MountedForm;
  let unsubscribe = () => {};
  let disposed = false;
  let pendingSubmission: {
    view: FormViewController;
    controller: AbortController;
    valuesKey: string;
    edited: boolean;
  } | null = null;
  let syncView: (snapshot: FormViewSnapshot) => void = () => {};
  const form = page.querySelector<HTMLFormElement>("form")!;
  const submit = page.querySelector<HTMLButtonElement>('[data-role="submit"]')!;
  const errors = page.querySelector<HTMLElement>('[data-role="errors"]')!;
  const status = page.querySelector<HTMLElement>('[data-role="status"]')!;
  const host = page.querySelector<HTMLElement>('[data-role="fields"]')!;

  const mountView = (initialValues?: Record<string, unknown>) => {
    unsubscribe();
    mounted?.unmount();
    host.replaceChildren();
    const layout: FormLayoutConfig = config.layout ?? {
      kind: "stacked",
      children: [
        ...(config.sections ?? []).map((section, index) => ({
          kind: "section" as const,
          id: `measurements-${index}`,
          title: section.title,
          defaultOpen: true,
          children: [
            {
              kind: "group" as const,
              columns: section.columns ?? 3,
              children: section.fields.map((field) => ({ kind: "field" as const, field })),
            },
          ],
        })),
        {
          kind: "section" as const,
          id: "prediction-results",
          title: config.resultTitle ?? "Prediction",
          defaultOpen: true,
          children: (config.schema.reports ?? []).map(({ id }) => {
            if (!id) throw new Error("Clinical report layouts require explicit report ids.");
            return { kind: "report" as const, report: id };
          }),
        },
      ],
    };
    mounted = mountForm(host, {
      schema: config.schema,
      layout,
      transport: config.transport,
      plugins: config.plugins,
      initialValues:
        initialValues && config.toFormValues ? config.toFormValues(initialValues) : initialValues,
      reportFetchMode: "none",
      reportPane: "always",
      designSystem: designSystem,
      primitiveRegistry: config.primitiveRegistry,
      primitiveText: {
        categoryPlaceholder: "Select an option",
        reportsEmptyTitle: config.emptyTitle,
        reportsEmptyBody: config.emptyBody,
        seriesAddRow: "Add measurement",
        seriesRemoveRow: "Remove measurement",
        ...config.primitiveText,
      },
    });
    const kitHost = mounted.host as HTMLElement & {
      view: FormViewController;
      reportPane: "hidden" | "always";
    };
    view = kitHost.view;
    let successfulSubmitCount = 0;
    let successfulValues: string | null = null;
    let resultInvalidated = false;
    const sync = (snapshot: FormViewSnapshot) => {
      const valuesKey = JSON.stringify(snapshot.form.values);
      const pending = pendingSubmission?.view === view ? pendingSubmission : null;
      if (pending && !pending.edited && valuesKey !== pending.valuesKey) {
        pending.edited = true;
        resultInvalidated = true;
        pending.controller.abort();
      }
      const busy = Boolean(pending) || snapshot.form.operation !== "idle";
      if (
        !busy &&
        snapshot.form.submissionStatus === "succeeded" &&
        snapshot.form.submitCount !== successfulSubmitCount
      ) {
        successfulSubmitCount = snapshot.form.submitCount;
        successfulValues = valuesKey;
        resultInvalidated = false;
      }
      const stale = successfulValues !== null && valuesKey !== successfulValues;
      const hideResults =
        resultInvalidated ||
        (successfulValues !== null &&
          (busy || stale || snapshot.form.submissionStatus !== "succeeded"));
      kitHost.reportPane = hideResults ? "hidden" : "always";
      submit.disabled = busy;
      submit.textContent = busy ? config.submittingLabel : config.submitLabel;
      page.querySelector<HTMLButtonElement>('[data-role="load-example"]')!.disabled = busy;
      status.textContent =
        stale && config.staleLabel ? config.staleLabel : config.getStatus(snapshot);
      const messages = [...(snapshot.form.errors.form ?? [])];
      if (snapshot.form.submissionStatus === "failed" && messages.length === 0) {
        messages.push(config.failureLabel);
      }
      errors.replaceChildren(
        ...messages.map((message) => {
          const line = document.createElement("p");
          line.textContent = message;
          return line;
        }),
      );
      errors.hidden = messages.length === 0;
      config.onSnapshot?.(page, snapshot);
    };
    syncView = sync;
    unsubscribe = view.subscribe(sync);
    sync(view.getSnapshot());
  };
  mountView(config.initialValues);

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    if (pendingSubmission) return;
    const submittedView = view;
    const pending = {
      view: submittedView,
      controller: new AbortController(),
      valuesKey: JSON.stringify(view.form.state.values),
      edited: false,
    };
    pendingSubmission = pending;
    try {
      await mounted.submit({ signal: pending.controller.signal });
    } catch (error) {
      if (disposed || view !== submittedView || pending.edited) return;
      errors.hidden = false;
      errors.textContent =
        error instanceof Error && error.name === "ValidationError"
          ? config.validationLabel
          : error instanceof Error
            ? error.message
            : config.failureLabel;
    } finally {
      if (pendingSubmission === pending) pendingSubmission = null;
      if (!disposed && view === submittedView) {
        const errorMessage = errors.hidden ? null : errors.textContent;
        syncView(view.getSnapshot());
        if (errorMessage && !pending.edited) {
          errors.hidden = false;
          errors.textContent = errorMessage;
        }
        if (pending.edited)
          status.textContent =
            config.staleLabel ?? "Parameters changed. Select Predict to run again.";
      }
    }
  };
  form.addEventListener("submit", handleSubmit);
  page
    .querySelector<HTMLButtonElement>('[data-role="load-example"]')!
    .addEventListener("click", () => {
      if (pendingSubmission) return;
      const example = config.examples.find(({ id }) => id === select.value);
      if (example) mountView(structuredClone(example.values));
      else select.focus();
    });
  return {
    get form() {
      return view.form;
    },
    updateDesignSystem(value: DesignSystemConfig) {
      page.dataset.mode = value.mode ?? "auto";
      design.update(value);
      designSystem = value;
      mounted.updateDesignSystem(value);
    },
    unmount() {
      disposed = true;
      pendingSubmission?.controller.abort();
      form.removeEventListener("submit", handleSubmit);
      unsubscribe();
      mounted.unmount();
      design.disconnect();
      page.remove();
    },
  };
};
