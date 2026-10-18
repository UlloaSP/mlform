import type { DesignSystemConfig } from "mlform/design";

export const createCodePreview = (
  container: HTMLElement,
  onStatus: (status: "running" | "ready" | "error", message?: string) => void,
) => {
  let frame: HTMLIFrameElement | null = null;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let code = "";
  let designSystem: DesignSystemConfig = {};
  const send = (data: object) => frame?.contentWindow?.postMessage(data, "*");
  const clear = () => {
    clearTimeout(timeout);
    frame?.remove();
    frame = null;
  };
  const message = (event: MessageEvent) => {
    if (
      !frame ||
      event.source !== frame.contentWindow ||
      !event.data ||
      typeof event.data !== "object"
    )
      return;
    if (event.data.type === "mlform-code-ready") {
      send({ type: "mlform-code-run", code, designSystem });
    } else if (event.data.type === "mlform-code-result") {
      clearTimeout(timeout);
      if (typeof event.data.error === "string") onStatus("error", event.data.error);
      else onStatus("ready");
    }
  };
  window.addEventListener("message", message);
  return {
    run(compiled: string, design: DesignSystemConfig) {
      clear();
      code = compiled;
      designSystem = design;
      onStatus("running");
      frame = document.createElement("iframe");
      frame.title = "MLForm code preview";
      frame.setAttribute("sandbox", "allow-scripts");
      frame.src = `${import.meta.env.BASE_URL}code-preview.html`;
      container.replaceChildren(frame);
      timeout = setTimeout(() => {
        clear();
        onStatus("error", "Execution did not finish. Check your code and run it again.");
      }, 15_000);
    },
    updateDesignSystem(config: DesignSystemConfig) {
      designSystem = config;
      send({ type: "mlform-code-theme", designSystem });
    },
    destroy() {
      clear();
      window.removeEventListener("message", message);
    },
  };
};
