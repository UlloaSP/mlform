// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css } from "lit";

export const wizardRootStyles = css`
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
    grid-template-rows: 1fr;
    gap: var(--mlf-shell-gap, 1rem);
    inline-size: 100%;
    block-size: 100%;
    min-width: 0;
    min-height: 0;
  }
  .panel {
    display: flex;
    flex-direction: column;
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
  .pane-header {
    flex: 0 0 auto;
    display: grid;
    gap: 0.85rem;
    padding: 1rem 1.5rem;
    border-bottom: var(--mlf-border-width, 1px) solid
      var(--mlf-shell-panel-border, var(--mlf-color-border, #e2e8f0));
    background: var(
      --mlf-shell-header-bg,
      color-mix(in srgb, var(--mlf-color-surface, #ffffff) 76%, transparent)
    );
    backdrop-filter: blur(var(--mlf-shell-header-blur, 3px));
    -webkit-backdrop-filter: blur(var(--mlf-shell-header-blur, 3px));
  }
  .step-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--mlf-pane-title-color, var(--mlf-color-text, #0f172a));
    line-height: 1.3;
  }
  .step-description {
    margin: 0;
    font-size: var(--mlf-font-size-sm, 0.84rem);
    color: var(--mlf-color-text-muted, #475569);
    line-height: 1.5;
  }
  .pane-body {
    flex: 1 1 auto;
    display: grid;
    align-content: start;
    gap: 1rem;
    padding: 1rem 1rem 1.25rem;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .collection,
  .section-children,
  .section,
  .group {
    display: grid;
    gap: var(--mlf-section-gap, 1rem);
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
  .actions {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1.5rem;
    border-top: var(--mlf-border-width, 1px) solid
      var(--mlf-shell-panel-border, var(--mlf-color-border, #e2e8f0));
    background: var(--mlf-shell-action-bg, var(--mlf-color-surface-muted, #f5f7fa));
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 2.5rem;
    padding: 0.5rem 1.25rem;
    border: var(--mlf-border-width, 1px) solid transparent;
    border-radius: var(--mlf-input-radius, 12px);
    font: inherit;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease,
      opacity 0.2s ease;
  }
  .btn:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
  .btn-prev {
    background: transparent;
    border-color: var(--mlf-input-border, var(--mlf-color-border, #e2e8f0));
    color: var(--mlf-color-text-muted, #475569);
  }
  .btn-next,
  .btn-submit {
    background: var(--mlf-submit-bg, var(--mlf-color-accent, #1e40af));
    border-color: var(--mlf-submit-bg, var(--mlf-color-accent, #1e40af));
    color: var(--mlf-submit-color, #ffffff);
  }
  .spacer {
    flex: 1 1 auto;
  }
  @media (max-width: 900px) {
    .group.columns-2,
    .group.columns-3 {
      grid-template-columns: minmax(0, 1fr);
    }
  }
`;
