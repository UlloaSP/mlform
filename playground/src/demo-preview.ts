import type { DemoHandle, DemoState } from "./demo-types.ts";
import { attachDesignSystem } from "mlform/design";
import { FIXED_LAYOUT_DEMO_IDS, getDemoById, getRouteDemoId } from "./demo-catalog.ts";
import { captureDemoState, restoreDemoState } from "./demo-state.ts";
import { readDesignSystem } from "./demo-settings.ts";

export const mountDemoPreview = (container = document.getElementById("root") ?? document.body) => {
  const outlet = document.createElement("main");
  outlet.className = "preview-stage";
  container.replaceChildren(outlet);
  document.documentElement.classList.add("preview-page");

  let currentDemoId = "";
  let currentUnmount: (() => void) | null = null;
  let currentMounted: DemoHandle | null = null;
  let designSystem = readDesignSystem();
  const previewDesign = attachDesignSystem(document.documentElement, { config: designSystem });

  const syncFromHash = () => {
    const nextDemo = getDemoById(getRouteDemoId());
    if (currentDemoId === nextDemo.id) return;
    currentUnmount?.();
    outlet.replaceChildren();
    currentDemoId = nextDemo.id;
    outlet.classList.toggle("is-fixed-layout", FIXED_LAYOUT_DEMO_IDS.has(nextDemo.id));
    currentMounted = nextDemo.mount(outlet, designSystem);
    currentUnmount =
      typeof currentMounted?.unmount === "function" ? () => currentMounted?.unmount() : null;
  };

  const handleMessage = (event: MessageEvent) => {
    if (
      event.origin !== window.location.origin ||
      event.source !== window.parent ||
      event.data?.type !== "mlform-preview-design"
    )
      return;
    designSystem = event.data.designSystem;
    previewDesign.update(designSystem);
    currentMounted?.updateDesignSystem?.(designSystem);
  };

  window.addEventListener("hashchange", syncFromHash);
  window.addEventListener("message", handleMessage);
  syncFromHash();

  return {
    captureState: () => captureDemoState(currentMounted, outlet),
    restoreState: (state: DemoState | null | undefined) =>
      restoreDemoState(currentMounted, outlet, state),
    unmount() {
      window.removeEventListener("hashchange", syncFromHash);
      window.removeEventListener("message", handleMessage);
      currentUnmount?.();
      previewDesign.disconnect();
      outlet.remove();
      document.documentElement.classList.remove("preview-page");
    },
  };
};
