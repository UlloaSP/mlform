import { DEMOS } from "./demo-catalog.ts";
import mark from "../../brand/mlform.png?url";

export const createShell = () => {
  const shell = document.createElement("main");
  shell.className = "app-shell";
  shell.innerHTML = `
    <header class="app-brand-header">
      <a class="mlform-brand" href="https://eshkra.dev" aria-label="MLForm, part of eshkra">
        <img src="${mark}" alt="" width="36" height="40" />
        <span class="mlform-wordmark" translate="no"><span class="ml">ML</span><span class="rest">form</span></span>
      </a>
      <nav aria-label="MLForm resources">
        <a href="https://docs.mlform.eshkra.dev/">Docs</a>
        <a href="https://github.com/UlloaSP/mlform">GitHub</a>
        <a href="https://eshkra.dev">eshkra ↗</a>
      </nav>
    </header>
    <div class="app-menu" data-role="menu">
      <button
        class="app-menu-button"
        type="button"
        aria-label="Playground options"
        aria-haspopup="dialog"
        aria-expanded="false"
        aria-controls="demo-menu-panel"
        data-role="menu-button"
      >
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      <div class="app-menu-panel" id="demo-menu-panel" role="dialog" aria-label="Playground options" data-role="menu-panel" hidden>
        <nav class="app-menu-resources" aria-label="MLForm resources">
          <a href="https://docs.mlform.eshkra.dev/">Docs</a>
          <a href="https://github.com/UlloaSP/mlform">GitHub</a>
          <a href="https://eshkra.dev">eshkra</a>
        </nav>
        <div class="app-menu-list" role="menu" aria-label="Demo selector" data-role="menu-list"></div>
        <div class="app-menu-settings">
          <label class="app-menu-field">Design system<select data-role="theme-select"></select></label>
          <label class="app-menu-field">Style<select data-role="recipe-select"></select></label>
          <label class="app-menu-field">Appearance<select data-role="mode-select"></select></label>
          <label class="app-menu-field">Viewport size<select data-role="viewport-select"></select></label>
          <div class="app-menu-custom-size" data-role="custom-size" hidden>
            <label class="app-menu-field">Width (px)<input data-role="custom-width" type="number" min="1" max="8192" step="1" inputmode="numeric" /></label>
            <label class="app-menu-field">Height (px)<input data-role="custom-height" type="number" min="1" max="8192" step="1" inputmode="numeric" /></label>
          </div>
        </div>
      </div>
    </div>
    <div class="app-frame">
      <div class="app-stage" data-role="demo-outlet"></div>
    </div>
  `;
  return shell;
};

export const renderMenu = (
  menuList: HTMLElement,
  activeDemoId: string,
  onSelect: (id: string, restoreFocus: boolean) => void,
) => {
  menuList.replaceChildren(
    ...[...new Set(DEMOS.map((demo) => demo.group))].map((name) => {
      const group = document.createElement("div");
      group.className = "app-menu-group";
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", name);
      const label = document.createElement("div");
      label.className = "app-menu-section-label";
      label.setAttribute("aria-hidden", "true");
      label.textContent = name;
      group.append(label);
      for (const demo of DEMOS.filter((entry) => entry.group === name)) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `app-menu-option${demo.id === activeDemoId ? " is-active" : ""}`;
        button.setAttribute("role", "menuitemradio");
        button.setAttribute("aria-checked", String(demo.id === activeDemoId));
        button.tabIndex = demo.id === activeDemoId ? 0 : -1;
        button.textContent = demo.label;
        button.dataset.demoId = demo.id;
        button.addEventListener("click", (event) => {
          onSelect(demo.id, event.detail === 0);
        });
        group.append(button);
      }
      return group;
    }),
  );
};

export const fillSelect = (
  select: HTMLSelectElement,
  options: { id: string; label: string }[],
  selectedId: string,
) => {
  select.replaceChildren(
    ...options.map(({ id, label }) => {
      const option = new Option(label, id);
      option.selected = id === selectedId;
      return option;
    }),
  );
};

export const bindDemoMenu = (
  menu: HTMLElement,
  menuButton: HTMLButtonElement,
  menuPanel: HTMLElement,
  menuList: HTMLElement,
) => {
  const setMenuOpen = (open: boolean) => {
    menu.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuPanel.hidden = !open;
  };

  const getMenuOptions = () => [
    ...menuList.querySelectorAll<HTMLButtonElement>(".app-menu-option"),
  ];

  const focusMenuOption = (index: number) => {
    const options = getMenuOptions();
    if (options.length === 0) return;
    const targetIndex = (index + options.length) % options.length;
    options.forEach((option, optionIndex) => {
      option.tabIndex = optionIndex === targetIndex ? 0 : -1;
    });
    options[targetIndex]?.focus();
  };

  const handleMenuButtonClick = () => {
    const open = !menu.classList.contains("is-open");
    setMenuOpen(open);
    if (open) {
      const activeIndex = getMenuOptions().findIndex(
        (option) => option.getAttribute("aria-checked") === "true",
      );
      focusMenuOption(Math.max(0, activeIndex));
    }
  };

  const handleMenuButtonKeydown = (event: KeyboardEvent) => {
    if (event.key !== "ArrowDown") return;
    event.preventDefault();
    setMenuOpen(true);
    focusMenuOption(0);
  };

  const handleMenuListKeydown = (event: KeyboardEvent) => {
    const options = getMenuOptions();
    const currentIndex = options.findIndex((option) => option === document.activeElement);
    const keyTargets: Record<string, number> = {
      ArrowDown: currentIndex + 1,
      ArrowUp: currentIndex - 1,
      Home: 0,
      End: options.length - 1,
    };
    if (!(event.key in keyTargets)) return;
    event.preventDefault();
    focusMenuOption(keyTargets[event.key]);
  };

  const handleDocumentClick = (event: MouseEvent) => {
    if (event.target instanceof Node && !menu.contains(event.target)) {
      setMenuOpen(false);
    }
  };

  const handleDocumentKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && menu.classList.contains("is-open")) {
      setMenuOpen(false);
      menuButton.focus();
    }
  };

  menuButton.addEventListener("click", handleMenuButtonClick);
  menuButton.addEventListener("keydown", handleMenuButtonKeydown);
  menuList.addEventListener("keydown", handleMenuListKeydown);
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleDocumentKeydown);

  return {
    setMenuOpen,
    dispose() {
      menuButton.removeEventListener("click", handleMenuButtonClick);
      menuButton.removeEventListener("keydown", handleMenuButtonKeydown);
      menuList.removeEventListener("keydown", handleMenuListKeydown);
      document.removeEventListener("click", handleDocumentClick);
      document.removeEventListener("keydown", handleDocumentKeydown);
    },
  };
};
