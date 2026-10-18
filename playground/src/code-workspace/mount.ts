import type { DesignSystemConfig } from "mlform/design";
import type { DemoHandle } from "../demo-types.ts";
import { transform } from "sucrase";
import { CODE_EXAMPLES, getCodeExample } from "./examples.ts";
import { createCodeEditor } from "./editor.ts";
import { createCodePreview } from "./preview.ts";
import { bindCodeSplit } from "./split.ts";
import { isCodePosition, readWorkspaceState, saveWorkspaceState } from "./state.ts";
import "./styles.css";

export const mountCodeWorkspace = (
  container: HTMLElement,
  initialDesign: DesignSystemConfig,
): DemoHandle => {
  let state = readWorkspaceState(container.clientWidth);
  let designSystem = initialDesign;
  let executedCode = "";
  let pendingRun: ReturnType<typeof setTimeout> | undefined;
  const shell = document.createElement("section");
  shell.className = "code-workspace";
  shell.setAttribute("aria-label", "Code and preview");
  shell.innerHTML = `
    <div class="code-toolbar" role="group" aria-label="Editor options">
      <label class="code-example"><select aria-label="Code example"></select></label>
      <label class="code-position">
        <select aria-label="Code position">
          <option value="left">Code on the left</option><option value="right">Code on the right</option>
          <option value="top">Code above</option><option value="bottom">Code below</option>
        </select>
      </label>
      <button type="button" data-action="reset" aria-label="Reset example" title="Reset example">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2.7 8.4M3 4v6h6" /></svg>
      </button>
      <button type="button" data-action="run" aria-label="Rerun preview" title="Updates automatically as you type. Ctrl/⌘ + Enter to rerun the preview.">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1" /></svg>
      </button>
      <span class="code-status" role="status" aria-live="polite"></span>
      <p class="code-notice" role="status" hidden></p>
    </div>
    <div class="code-split">
      <section class="code-source code-pane" id="code-source" aria-label="Editor">
        <div class="code-editor"></div>
      </section>
      <div class="code-separator" role="separator" tabindex="0" aria-label="Code panel size"
        aria-controls="code-source" aria-valuemin="20" aria-valuemax="80"
        title="Drag to resize. Arrow keys: move; Enter: equal sizes."></div>
      <section class="code-preview code-pane" aria-label="Preview">
        <pre class="code-error" role="alert" hidden></pre>
        <div class="code-preview-content"></div>
      </section>
    </div>
  `;
  container.replaceChildren(shell);
  const position = shell.querySelector<HTMLSelectElement>(".code-position select")!;
  const exampleSelect = shell.querySelector<HTMLSelectElement>(".code-example select")!;
  exampleSelect.replaceChildren(...CODE_EXAMPLES.map(({ id, label }) => new Option(label, id)));
  exampleSelect.value = state.exampleId;
  const runButton = shell.querySelector<HTMLButtonElement>('[data-action="run"]')!;
  const resetButton = shell.querySelector<HTMLButtonElement>('[data-action="reset"]')!;
  const status = shell.querySelector<HTMLElement>(".code-status")!;
  const errorBox = shell.querySelector<HTMLElement>(".code-error")!;
  const notice = shell.querySelector<HTMLElement>(".code-notice")!;
  const save = () => {
    if (!saveWorkspaceState(state)) {
      notice.hidden = false;
      notice.textContent = "Local saving is unavailable. Copy your code before leaving.";
    }
  };
  const preview = createCodePreview(
    shell.querySelector<HTMLElement>(".code-preview-content")!,
    (result, message) => {
      if (state.code !== executedCode) return;
      runButton.setAttribute("aria-busy", String(result === "running"));
      status.textContent =
        result === "running" ? "Updating…" : result === "error" ? "Error" : "Up to date";
      errorBox.hidden = result !== "error";
      errorBox.textContent = message ?? "";
    },
  );
  const run = () => {
    clearTimeout(pendingRun);
    errorBox.hidden = true;
    try {
      if (!state.code.trim()) throw new Error("Write an MLForm example before running it.");
      const compiled = transform(state.code, {
        transforms: ["typescript", "imports"],
        filePath: "example.ts",
        disableESTransforms: true,
        keepUnusedImports: true,
      });
      executedCode = state.code;
      preview.run(compiled.code, designSystem);
    } catch (error) {
      runButton.setAttribute("aria-busy", "false");
      status.textContent = "Error";
      errorBox.textContent = error instanceof Error ? error.message : String(error);
      errorBox.hidden = false;
    }
  };
  const editor = createCodeEditor(
    shell.querySelector<HTMLElement>(".code-editor")!,
    state.code,
    (code) => {
      state = { ...state, code };
      status.textContent = "Updating…";
      clearTimeout(pendingRun);
      pendingRun = setTimeout(run, 450);
      save();
    },
    run,
  );
  const split = bindCodeSplit(
    shell.querySelector<HTMLElement>(".code-split")!,
    shell.querySelector<HTMLElement>(".code-separator")!,
    state.position,
    state.ratio,
    (nextPosition, ratio) => {
      state = { ...state, position: nextPosition, ratio };
      save();
    },
  );
  position.value = state.position;
  const changePosition = () => {
    if (isCodePosition(position.value)) split.setPosition(position.value);
  };
  const reset = () => {
    editor.setCode(getCodeExample(state.exampleId).code);
    run();
    editor.focus();
  };
  const changeExample = () => {
    const example = getCodeExample(exampleSelect.value);
    state = { ...state, exampleId: example.id };
    editor.setCode(example.code);
    save();
    run();
  };
  exampleSelect.addEventListener("change", changeExample);
  position.addEventListener("change", changePosition);
  runButton.addEventListener("click", run);
  resetButton.addEventListener("click", reset);
  run();
  return {
    capturePresentationState: () => ({ ...state }),
    restorePresentationState(saved) {
      if (!saved || !("code" in saved)) return;
      state = { ...saved };
      editor.setCode(state.code);
      exampleSelect.value = state.exampleId;
      position.value = state.position;
      split.setPosition(state.position, state.ratio);
      run();
    },
    updateDesignSystem(config) {
      designSystem = config;
      preview.updateDesignSystem(config);
    },
    unmount() {
      clearTimeout(pendingRun);
      position.removeEventListener("change", changePosition);
      exampleSelect.removeEventListener("change", changeExample);
      runButton.removeEventListener("click", run);
      resetButton.removeEventListener("click", reset);
      editor.destroy();
      split.destroy();
      preview.destroy();
      shell.remove();
    },
  };
};
