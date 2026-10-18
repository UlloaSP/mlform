import { mountForm } from "mlform/kit";
import { attachDesignSystem } from "mlform/design";
import "./styles.css";

export const mountClinicalDemo = (container, config, designSystem) => {
  const page = document.createElement("div");
  page.className = `clinical-page ${config.className}`;
  page.innerHTML = config.shell;
  container.replaceChildren(page);
  page.dataset.mode = designSystem.mode;
  const design = attachDesignSystem(page, { config: designSystem });
  const select = page.querySelector('[data-role="example-select"]');
  select.replaceChildren(
    new Option(config.examplePlaceholder, ""),
    ...config.examples.map(({ id, label }) => new Option(label, id)),
  );
  let view;
  let mounted;
  let unsubscribe = () => {};
  let disposed = false;
  let pendingSubmission = null;
  let syncView = () => {};
  const form = page.querySelector("form");
  const submit = page.querySelector('[data-role="submit"]');
  const errors = page.querySelector('[data-role="errors"]');
  const status = page.querySelector('[data-role="status"]');
  const host = page.querySelector('[data-role="fields"]');

  const mountView = (initialValues) => {
    unsubscribe();
    mounted?.unmount();
    host.replaceChildren();
    const layout = config.layout ?? {
      kind: "stacked",
      children: [
        ...config.sections.map((section, index) => ({
          kind: "section",
          id: `measurements-${index}`,
          title: section.title,
          defaultOpen: true,
          children: [
            {
              kind: "group",
              columns: section.columns ?? 3,
              children: section.fields.map((field) => ({ kind: "field", field })),
            },
          ],
        })),
        {
          kind: "section",
          id: "prediction-results",
          title: config.resultTitle,
          defaultOpen: true,
          children: config.schema.reports.map(({ id }) => ({ kind: "report", report: id })),
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
        seriesAddRow: "Añadir medición",
        seriesRemoveRow: "Eliminar medición",
        ...config.primitiveText,
      },
    });
    view = mounted.host.view;
    let successfulSubmitCount = 0;
    let successfulValues = null;
    let resultInvalidated = false;
    const sync = (snapshot) => {
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
      mounted.host.reportPane = hideResults ? "hidden" : "always";
      submit.disabled = busy;
      submit.textContent = busy ? config.submittingLabel : config.submitLabel;
      page.querySelector('[data-role="load-example"]').disabled = busy;
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

  const handleSubmit = async (event) => {
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
      await submittedView.submit({ signal: pending.controller.signal });
    } catch (error) {
      if (disposed || view !== submittedView || pending.edited) return;
      errors.hidden = false;
      errors.textContent =
        error.name === "ValidationError" ? config.validationLabel : error.message;
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
  page.querySelector('[data-role="load-example"]').addEventListener("click", () => {
    if (pendingSubmission) return;
    const example = config.examples.find(({ id }) => id === select.value);
    if (example) mountView(structuredClone(example.values));
    else select.focus();
  });
  return {
    get form() {
      return view.form;
    },
    updateDesignSystem(value) {
      page.dataset.mode = value.mode;
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
