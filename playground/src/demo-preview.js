import { FIXED_LAYOUT_DEMO_IDS, getDemoById, getRouteDemoId } from "./demo-catalog.js";
import { readDesignSystem } from "./demo-settings.js";

export const mountDemoPreview = (container = document.getElementById("root") ?? document.body) => {
  const outlet = document.createElement("main");
  outlet.className = "preview-stage";
  container.replaceChildren(outlet);
  document.documentElement.classList.add("preview-page");

  let currentDemoId = "";
  let currentUnmount = null;
  let currentMounted = null;
  let designSystem = readDesignSystem();
  document.body.dataset.mode = designSystem.mode;

  const syncFromHash = () => {
    const nextDemo = getDemoById(getRouteDemoId());
    if (currentDemoId === nextDemo.id) return;
    currentUnmount?.();
    outlet.replaceChildren();
    currentDemoId = nextDemo.id;
    outlet.classList.toggle("is-fixed-layout", FIXED_LAYOUT_DEMO_IDS.has(nextDemo.id));
    currentMounted = nextDemo.mount(outlet, designSystem);
    currentUnmount =
      typeof currentMounted?.unmount === "function" ? () => currentMounted.unmount() : null;
  };

  const handleMessage = (event) => {
    if (
      event.origin !== window.location.origin ||
      event.source !== window.parent ||
      event.data?.type !== "mlform-preview-design"
    )
      return;
    designSystem = event.data.designSystem;
    document.body.dataset.mode = designSystem.mode;
    currentMounted?.updateDesignSystem?.(designSystem);
  };

  window.addEventListener("hashchange", syncFromHash);
  window.addEventListener("message", handleMessage);
  syncFromHash();

  return {
    unmount() {
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("message", handleMessage);
      currentUnmount?.();
      outlet.remove();
      document.documentElement.classList.remove("preview-page");
    },
  };
};
