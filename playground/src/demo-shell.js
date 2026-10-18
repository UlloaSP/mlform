import { FIXED_LAYOUT_DEMO_IDS, getDemoById, getRouteDemoId } from "./demo-catalog.js";
import {
  DESIGN_STORAGE_KEY,
  VIEWPORT_STORAGE_KEY,
  THEMES,
  RECIPES,
  MODES,
  VIEWPORTS,
  SIZE_LIMITS,
  validSize,
  readViewport,
  getViewportSize,
  readDesignSystem,
} from "./demo-settings.js";
import { createShell, renderMenu, fillSelect, bindDemoMenu } from "./demo-menu.js";

export const mountDemoShell = (container = document.body) => {
  const shell = createShell();
  container.replaceChildren(shell);

  const menu = shell.querySelector('[data-role="menu"]');
  const menuButton = shell.querySelector('[data-role="menu-button"]');
  const menuPanel = shell.querySelector('[data-role="menu-panel"]');
  const menuList = shell.querySelector('[data-role="menu-list"]');
  const themeSelect = shell.querySelector('[data-role="theme-select"]');
  const recipeSelect = shell.querySelector('[data-role="recipe-select"]');
  const modeSelect = shell.querySelector('[data-role="mode-select"]');
  const viewportSelect = shell.querySelector('[data-role="viewport-select"]');
  const customSize = shell.querySelector('[data-role="custom-size"]');
  const customWidth = shell.querySelector('[data-role="custom-width"]');
  const customHeight = shell.querySelector('[data-role="custom-height"]');
  const demoOutlet = shell.querySelector('[data-role="demo-outlet"]');

  if (
    !(menu instanceof HTMLElement) ||
    !(menuButton instanceof HTMLButtonElement) ||
    !(menuPanel instanceof HTMLElement) ||
    !(menuList instanceof HTMLElement) ||
    !(themeSelect instanceof HTMLSelectElement) ||
    !(recipeSelect instanceof HTMLSelectElement) ||
    !(modeSelect instanceof HTMLSelectElement) ||
    !(viewportSelect instanceof HTMLSelectElement) ||
    !(customSize instanceof HTMLElement) ||
    !(customWidth instanceof HTMLInputElement) ||
    !(customHeight instanceof HTMLInputElement) ||
    !(demoOutlet instanceof HTMLElement)
  ) {
    throw new Error("Demo shell failed to initialize.");
  }

  let currentUnmount = null;
  let currentMounted = null;
  let currentDemoId = "";
  let designSystem = readDesignSystem();
  let viewport = readViewport();
  let previewFrame = null;
  let previewViewport = null;
  let previewLabel = null;

  fillSelect(themeSelect, THEMES, designSystem.theme);
  fillSelect(recipeSelect, RECIPES, designSystem.recipe);
  fillSelect(modeSelect, MODES, designSystem.mode);
  fillSelect(viewportSelect, VIEWPORTS, viewport.id);
  customWidth.value = String(viewport.customWidth);
  customHeight.value = String(viewport.customHeight);
  customSize.hidden = viewport.id !== "custom";
  shell.dataset.mode = designSystem.mode;

  const menuBinding = bindDemoMenu(menu, menuButton, menuPanel, menuList);
  const { setMenuOpen } = menuBinding;

  const sendDesignToPreview = () => {
    previewFrame?.contentWindow?.postMessage(
      { type: "mlform-preview-design", designSystem },
      window.location.origin,
    );
  };

  const updatePreviewSize = () => {
    if (!previewFrame || !previewViewport || !previewLabel) return;
    const { width, height } = getViewportSize(viewport);
    const scale = Math.min(1, demoOutlet.clientWidth / width);
    previewViewport.style.width = `${width * scale}px`;
    previewViewport.style.height = `${height * scale}px`;
    previewFrame.style.width = `${width}px`;
    previewFrame.style.height = `${height}px`;
    previewFrame.style.transform = `scale(${scale})`;
    previewLabel.textContent = `${VIEWPORTS.find(({ id }) => id === viewport.id)?.label.split(" · ")[0]} · ${width} × ${height} px${scale < 1 ? ` · ${Math.round(scale * 100)} %` : ""}`;
  };

  const mountCurrentDemo = () => {
    currentUnmount?.();
    currentUnmount = null;
    currentMounted = null;
    previewFrame = null;
    previewViewport = null;
    previewLabel = null;
    demoOutlet.replaceChildren();

    const simulated = viewport.id !== "actual";
    shell.classList.toggle("is-preview", simulated);
    shell.classList.toggle(
      "is-fixed-layout",
      !simulated && FIXED_LAYOUT_DEMO_IDS.has(currentDemoId),
    );

    if (simulated) {
      const preview = document.createElement("div");
      preview.className = "app-preview";
      previewLabel = document.createElement("div");
      previewLabel.className = "app-preview-label";
      previewViewport = document.createElement("div");
      previewViewport.className = "app-preview-viewport";
      previewFrame = document.createElement("iframe");
      previewFrame.className = "app-preview-frame";
      previewFrame.title = "Vista previa del playground";
      const url = new URL(window.location.href);
      url.search = "?preview=1";
      url.hash = currentDemoId;
      previewFrame.src = url.href;
      previewFrame.addEventListener("load", sendDesignToPreview);
      previewViewport.append(previewFrame);
      preview.append(previewLabel, previewViewport);
      demoOutlet.append(preview);
      updatePreviewSize();
      return;
    }

    const mounted = getDemoById(currentDemoId).mount(demoOutlet, designSystem);
    currentMounted = mounted;
    currentUnmount = typeof mounted?.unmount === "function" ? () => mounted.unmount() : null;
  };

  const previewResizeObserver = new ResizeObserver(updatePreviewSize);
  previewResizeObserver.observe(demoOutlet);

  const mountSelectedDemo = (demoId, restoreMenuFocus = false) => {
    const nextDemo = getDemoById(demoId);
    if (currentDemoId === nextDemo.id) {
      setMenuOpen(false);
      if (restoreMenuFocus) menuButton.focus();
      return;
    }

    currentDemoId = nextDemo.id;
    shell.dataset.demoId = nextDemo.id;
    window.location.hash = nextDemo.id;
    renderMenu(menuList, nextDemo.id, mountSelectedDemo);
    setMenuOpen(false);
    mountCurrentDemo();
    if (restoreMenuFocus) menuButton.focus();
  };

  const syncFromHash = () => {
    mountSelectedDemo(getRouteDemoId());
  };

  const handleDesignChange = (key, value) => {
    designSystem = { ...designSystem, [key]: value };
    shell.dataset.mode = designSystem.mode;
    currentMounted?.updateDesignSystem?.(designSystem);
    try {
      window.localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(designSystem));
    } catch {
      // The selection still works when storage is unavailable.
    }
    sendDesignToPreview();
  };

  const handleThemeChange = () => handleDesignChange("theme", themeSelect.value);
  const handleRecipeChange = () => handleDesignChange("recipe", recipeSelect.value);
  const handleModeChange = () => handleDesignChange("mode", modeSelect.value);

  const saveViewport = () => {
    try {
      window.localStorage.setItem(VIEWPORT_STORAGE_KEY, JSON.stringify(viewport));
    } catch {
      // The preview still works when storage is unavailable.
    }
  };

  const handleViewportChange = () => {
    const wasSimulated = viewport.id !== "actual";
    viewport = { ...viewport, id: viewportSelect.value };
    customSize.hidden = viewport.id !== "custom";
    saveViewport();
    if (wasSimulated !== (viewport.id !== "actual")) mountCurrentDemo();
    else updatePreviewSize();
  };

  const handleCustomSizeChange = () => {
    const width = customWidth.valueAsNumber;
    const height = customHeight.valueAsNumber;
    if (!validSize(width, SIZE_LIMITS.width) || !validSize(height, SIZE_LIMITS.height)) {
      customWidth.value = String(viewport.customWidth);
      customHeight.value = String(viewport.customHeight);
      return;
    }
    viewport = { ...viewport, customWidth: width, customHeight: height };
    saveViewport();
    updatePreviewSize();
  };

  window.addEventListener("hashchange", syncFromHash);
  themeSelect.addEventListener("change", handleThemeChange);
  recipeSelect.addEventListener("change", handleRecipeChange);
  modeSelect.addEventListener("change", handleModeChange);
  viewportSelect.addEventListener("change", handleViewportChange);
  customWidth.addEventListener("change", handleCustomSizeChange);
  customHeight.addEventListener("change", handleCustomSizeChange);
  syncFromHash();

  return {
    unmount() {
      window.removeEventListener("hashchange", syncFromHash);
      themeSelect.removeEventListener("change", handleThemeChange);
      recipeSelect.removeEventListener("change", handleRecipeChange);
      modeSelect.removeEventListener("change", handleModeChange);
      viewportSelect.removeEventListener("change", handleViewportChange);
      customWidth.removeEventListener("change", handleCustomSizeChange);
      customHeight.removeEventListener("change", handleCustomSizeChange);
      menuBinding.dispose();
      previewResizeObserver.disconnect();
      currentUnmount?.();
      shell.remove();
    },
  };
};
