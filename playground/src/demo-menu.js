import { DEMOS } from "./demo-catalog.js";
import mark from "../../brand/mlform.png?url";

export const createShell = () => {
  const shell = document.createElement("main");
  shell.className = "app-shell";
  shell.innerHTML = `
    <header class="app-brand-header">
      <a class="mlform-brand" href="https://eshkra.dev" aria-label="MLForm, parte de eshkra">
        <img src="${mark}" alt="" width="36" height="40" />
        <span class="mlform-wordmark" translate="no"><span class="ml">ML</span><span class="rest">form</span></span>
      </a>
      <span class="app-brand-context">playground</span>
      <nav aria-label="Recursos de MLForm">
        <a href="https://docs.mlform.eshkra.dev/">Docs</a>
        <a href="https://github.com/UlloaSP/mlform">GitHub</a>
        <a href="https://eshkra.dev">eshkra ↗</a>
      </nav>
    </header>
    <div class="app-menu" data-role="menu">
      <button
        class="app-menu-button"
        type="button"
        aria-label="Opciones del playground"
        aria-haspopup="dialog"
        aria-expanded="false"
        aria-controls="demo-menu-panel"
        data-role="menu-button"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      <div class="app-menu-panel" id="demo-menu-panel" role="dialog" aria-label="Opciones del playground" data-role="menu-panel" hidden>
        <div class="app-menu-section-label">Playground</div>
        <div class="app-menu-list" role="menu" aria-label="Demo selector" data-role="menu-list"></div>
        <div class="app-menu-settings">
          <label class="app-menu-field">Design system<select data-role="theme-select"></select></label>
          <label class="app-menu-field">Estilo<select data-role="recipe-select"></select></label>
          <label class="app-menu-field">Apariencia<select data-role="mode-select"></select></label>
          <label class="app-menu-field">Tamaño de pantalla<select data-role="viewport-select"></select></label>
          <div class="app-menu-custom-size" data-role="custom-size" hidden>
            <label class="app-menu-field">Ancho (px)<input data-role="custom-width" type="number" min="1" max="8192" step="1" inputmode="numeric" /></label>
            <label class="app-menu-field">Alto (px)<input data-role="custom-height" type="number" min="1" max="8192" step="1" inputmode="numeric" /></label>
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

export const renderMenu = (menuList, activeDemoId, onSelect) => {
  menuList.replaceChildren(
    ...DEMOS.map((demo) => {
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
      return button;
    }),
  );
};

export const fillSelect = (select, options, selectedId) => {
  select.replaceChildren(
    ...options.map(({ id, label }) => {
      const option = new Option(label, id);
      option.selected = id === selectedId;
      return option;
    }),
  );
};

export const bindDemoMenu = (menu, menuButton, menuPanel, menuList) => {
  const setMenuOpen = (open) => {
    menu.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuPanel.hidden = !open;
  };

  const getMenuOptions = () => [...menuList.querySelectorAll(".app-menu-option")];

  const focusMenuOption = (index) => {
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

  const handleMenuButtonKeydown = (event) => {
    if (event.key !== "ArrowDown") return;
    event.preventDefault();
    setMenuOpen(true);
    focusMenuOption(0);
  };

  const handleMenuListKeydown = (event) => {
    const options = getMenuOptions();
    const currentIndex = options.indexOf(document.activeElement);
    const keyTargets = {
      ArrowDown: currentIndex + 1,
      ArrowUp: currentIndex - 1,
      Home: 0,
      End: options.length - 1,
    };
    if (!(event.key in keyTargets)) return;
    event.preventDefault();
    focusMenuOption(keyTargets[event.key]);
  };

  const handleDocumentClick = (event) => {
    if (!menu.contains(event.target)) {
      setMenuOpen(false);
    }
  };

  const handleDocumentKeydown = (event) => {
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
