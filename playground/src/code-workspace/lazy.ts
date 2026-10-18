import type { DesignSystemConfig } from "mlform/design";
import type { DemoHandle, PresentationState } from "../demo-types.ts";

export const mountCodeWorkspace = (
  container: HTMLElement,
  initialDesign: DesignSystemConfig,
): DemoHandle => {
  let mounted: DemoHandle | undefined;
  let disposed = false;
  let designSystem = initialDesign;
  let pendingState: PresentationState | undefined;
  const message = document.createElement("p");
  message.setAttribute("role", "status");
  message.textContent = "Loading editor…";
  container.replaceChildren(message);
  void import("./mount.ts")
    .then((module) => {
      if (disposed) return;
      mounted = module.mountCodeWorkspace(container, designSystem);
      mounted.restorePresentationState?.(pendingState);
    })
    .catch(() => {
      if (disposed) return;
      message.setAttribute("role", "alert");
      message.textContent = "The editor could not load. Reopen this view to try again.";
      container.replaceChildren(message);
    });
  return {
    capturePresentationState: () => mounted?.capturePresentationState?.() ?? pendingState,
    restorePresentationState(state) {
      pendingState = state;
      mounted?.restorePresentationState?.(state);
    },
    updateDesignSystem(config) {
      designSystem = config;
      mounted?.updateDesignSystem(config);
    },
    unmount() {
      disposed = true;
      mounted?.unmount();
      message.remove();
    },
  };
};
