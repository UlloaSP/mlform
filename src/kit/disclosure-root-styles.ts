// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css } from "lit";

export const disclosureRootStyles = css`
  :host {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    color: var(--mlf-shell-color, var(--mlf-color-text, #0f172a));
    background: var(--mlf-shell-bg, var(--mlf-color-bg, #f5f7fa));
    font-family: var(--mlf-font-family-body);
  }
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  .root {
    display: grid;
    grid-template-rows: auto 1fr auto;
    min-height: 100%;
    border-radius: var(--mlf-panel-radius, 12px);
    border: var(--mlf-border-width, 1px) solid
      var(--mlf-shell-panel-border, var(--mlf-color-border, #e2e8f0));
    background: var(--mlf-shell-panel-bg, var(--mlf-color-surface, #ffffff));
    box-shadow:
      0 2px 4px var(--mlf-shell-panel-shadow-soft, rgba(0, 0, 0, 0.04)),
      0 8px 16px var(--mlf-shell-panel-shadow, rgba(0, 0, 0, 0.04));
    overflow: hidden;
  }
  .header,
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
    background: var(
      --mlf-shell-header-bg,
      color-mix(in srgb, var(--mlf-color-surface, #ffffff) 76%, transparent)
    );
    border-bottom: var(--mlf-border-width, 1px) solid
      var(--mlf-shell-panel-border, var(--mlf-color-border, #e2e8f0));
  }
  .footer {
    border-bottom: none;
    border-top: var(--mlf-border-width, 1px) solid
      var(--mlf-shell-panel-border, var(--mlf-color-border, #e2e8f0));
    background: var(--mlf-shell-action-bg, var(--mlf-color-surface-muted, #f5f7fa));
  }
  .title {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
  }
  .actions {
    display: inline-flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .body {
    display: grid;
    gap: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }
  .section + .section {
    border-top: var(--mlf-border-width, 1px) solid
      var(--mlf-panel-border, var(--mlf-color-border, #e2e8f0));
  }
  .section-toggle {
    inline-size: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 1rem;
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .section-copy,
  .nested-copy {
    display: grid;
    gap: 0.35rem;
  }
  .section-title {
    margin: 0;
    font-size: 0.96rem;
    font-weight: 700;
  }
  .section-description,
  .nested-description {
    margin: 0;
    font-size: var(--mlf-font-size-sm, 0.84rem);
    color: var(--mlf-color-text-muted, #475569);
    line-height: 1.5;
  }
  .chevron {
    font-size: 1.1rem;
    color: var(--mlf-color-text-muted, #475569);
  }
  .section-panel {
    display: grid;
    gap: 1rem;
    padding: 0 1rem 1rem;
  }
  .collection,
  .section-children,
  .nested-section,
  .group {
    display: grid;
    gap: var(--mlf-section-gap, 1rem);
  }
  .nested-copy {
    padding: 0 0.5rem;
  }
  .nested-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
  }
  .group.columns-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .group.columns-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
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
  .btn-submit {
    border-color: var(--mlf-submit-bg, var(--mlf-color-accent, #1e40af));
    background: var(--mlf-submit-bg, var(--mlf-color-accent, #1e40af));
    color: var(--mlf-submit-color, #ffffff);
  }
  .btn:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
  @media (max-width: 900px) {
    .group.columns-2,
    .group.columns-3 {
      grid-template-columns: minmax(0, 1fr);
    }
    .header,
    .footer {
      flex-direction: column;
      align-items: stretch;
    }
  }
`;
