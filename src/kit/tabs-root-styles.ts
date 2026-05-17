// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css } from "lit";

export const tabsRootStyles = css`
  :host {
    display: block;
    flex: 1 1 auto;
    align-self: stretch;
    inline-size: 100%;
    block-size: 100%;
    color: var(--mlf-shell-color, var(--mlf-color-text, #0f172a));
    background: var(--mlf-shell-bg, var(--mlf-color-bg, #f5f7fa));
    font-family: var(--mlf-font-family-body);
    min-width: 0;
    min-height: 0;
  }
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  .root {
    display: grid;
    grid-template-rows: auto 1fr auto;
    inline-size: 100%;
    block-size: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    border-radius: var(--mlf-panel-radius, 12px);
    border: var(--mlf-border-width, 1px) solid
      var(--mlf-shell-panel-border, var(--mlf-color-border, #e2e8f0));
    background: var(--mlf-shell-panel-bg, var(--mlf-color-surface, #ffffff));
    box-shadow:
      0 2px 4px var(--mlf-shell-panel-shadow-soft, rgba(0, 0, 0, 0.04)),
      0 8px 16px var(--mlf-shell-panel-shadow, rgba(0, 0, 0, 0.04));
  }
  .tablist {
    display: flex;
    gap: 0.35rem;
    overflow-x: auto;
    padding: 0.85rem 1rem 0;
    border-bottom: var(--mlf-border-width, 1px) solid
      var(--mlf-shell-panel-border, var(--mlf-color-border, #e2e8f0));
    background: var(
      --mlf-shell-header-bg,
      color-mix(in srgb, var(--mlf-color-surface, #ffffff) 76%, transparent)
    );
    scrollbar-width: thin;
  }
  .tab {
    position: relative;
    border: none;
    border-radius: 12px 12px 0 0;
    background: transparent;
    color: var(--mlf-color-text-muted, #475569);
    font: inherit;
    font-size: 0.94rem;
    font-weight: 600;
    padding: 0.85rem 1rem 0.75rem;
    cursor: pointer;
    white-space: nowrap;
  }
  .tab[aria-selected="true"] {
    color: var(--mlf-color-text, #0f172a);
    background: color-mix(in srgb, var(--mlf-color-surface, #ffffff) 94%, transparent);
  }
  .tab[aria-selected="true"]::after {
    content: "";
    position: absolute;
    inset-inline: 0.8rem;
    inset-block-end: 0;
    block-size: 3px;
    border-radius: 999px;
    background: var(--mlf-color-accent, #1e40af);
  }
  .tab-panel {
    display: grid;
    grid-template-rows: auto 1fr;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }
  .tab-header {
    display: grid;
    gap: 0.35rem;
    padding: 1rem 1.25rem 0.5rem;
  }
  .tab-title {
    margin: 0;
    font-size: 1.08rem;
    font-weight: 700;
    color: var(--mlf-color-text, #0f172a);
    line-height: 1.3;
  }
  .tab-description {
    margin: 0;
    font-size: var(--mlf-font-size-sm, 0.84rem);
    color: var(--mlf-color-text-muted, #475569);
    line-height: 1.5;
  }
  .body {
    display: grid;
    align-content: start;
    gap: 1rem;
    padding: 0.5rem 1rem 1.25rem;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .collection,
  .section-children,
  .group {
    display: grid;
    gap: var(--mlf-section-gap, 1rem);
  }
  .section {
    display: grid;
    gap: 0.9rem;
  }
  .section-copy {
    display: grid;
    gap: 0.35rem;
    padding: 0 0.5rem;
  }
  .section-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--mlf-color-text, #0f172a);
  }
  .section-description {
    margin: 0;
    font-size: var(--mlf-font-size-sm, 0.84rem);
    color: var(--mlf-color-text-muted, #475569);
    line-height: 1.5;
  }
  .group.columns-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .group.columns-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.85rem 1rem 1rem;
    border-top: var(--mlf-border-width, 1px) solid
      var(--mlf-shell-panel-border, var(--mlf-color-border, #e2e8f0));
    background: var(--mlf-shell-action-bg, var(--mlf-color-surface-muted, #f5f7fa));
  }
  .nav {
    display: inline-flex;
    gap: 0.5rem;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.5rem;
    padding: 0.5rem 1rem;
    border-radius: var(--mlf-input-radius, 12px);
    border: var(--mlf-border-width, 1px) solid var(--mlf-input-border, #e2e8f0);
    background: var(--mlf-input-bg, var(--mlf-color-surface-elevated, #ffffff));
    color: var(--mlf-color-text, #0f172a);
    font: inherit;
    font-size: 0.92rem;
    font-weight: 600;
    cursor: pointer;
  }
  .btn:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
  .btn-submit {
    border-color: var(--mlf-submit-bg, var(--mlf-color-accent, #1e40af));
    background: var(--mlf-submit-bg, var(--mlf-color-accent, #1e40af));
    color: var(--mlf-submit-color, #ffffff);
  }
  @media (max-width: 900px) {
    .group.columns-2,
    .group.columns-3 {
      grid-template-columns: minmax(0, 1fr);
    }
    .footer {
      flex-direction: column;
      align-items: stretch;
    }
    .nav {
      justify-content: space-between;
    }
  }
`;
