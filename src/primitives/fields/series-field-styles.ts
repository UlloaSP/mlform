// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css } from "lit";

export const seriesFieldStyles = css`
  .series {
    display: grid;
    gap: 0.9rem;
    container-type: inline-size;
    --mlf-series-control-height: max(
      var(--mlf-control-height, 3rem),
      calc(1.4em + 2 * var(--mlf-control-padding-block, 0.78rem) + 2 * var(--mlf-border-width, 1px))
    );
  }

  .toolbar {
    display: flex;
    justify-content: flex-end;
  }

  .add-btn,
  .remove-btn {
    border: var(--mlf-border-width, 1px) solid
      var(--mlf-series-action-border, var(--mlf-color-border, #cbd5e1));
    background: var(
      --mlf-series-action-bg,
      color-mix(in srgb, var(--mlf-color-accent, #1e40af) 9%, var(--mlf-color-surface, #ffffff))
    );
    color: var(--mlf-series-action-text, var(--mlf-color-text, #0f172a));
    font: inherit;
    line-height: 1.2;
    cursor: pointer;
    transition:
      background 0.2s ease,
      border-color 0.2s ease,
      transform 0.2s ease;
  }

  .add-btn {
    height: var(--mlf-series-control-height);
    padding: 0.65rem 1rem;
    border-radius: var(--mlf-input-radius, 8px);
    font-size: inherit;
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  .remove-btn {
    display: inline-grid;
    place-items: center;
    width: var(--mlf-series-control-height);
    height: var(--mlf-series-control-height);
    padding: 0;
    border-radius: var(--mlf-input-radius, 8px);
  }

  .remove-btn svg {
    width: 1.2rem;
    height: 1.2rem;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .add-btn:hover:not(:disabled),
  .remove-btn:hover:not(:disabled) {
    background: var(
      --mlf-series-action-bg-hover,
      color-mix(in srgb, var(--mlf-color-accent, #1e40af) 16%, var(--mlf-color-surface, #ffffff))
    );
    border-color: var(--mlf-series-action-border-hover, var(--mlf-color-accent, #1e40af));
    transform: translateY(-1px);
  }

  .add-btn:focus-visible,
  .remove-btn:focus-visible {
    outline: var(--mlf-focus-ring-width, 2px) solid
      var(--mlf-focus-ring-color, var(--mlf-color-accent, #2456c7));
    outline-offset: 2px;
  }

  .add-btn:disabled,
  .remove-btn:disabled {
    cursor: not-allowed;
    opacity: 0.65;
    transform: none;
  }

  .grid {
    display: grid;
    gap: 0.85rem;
  }

  .header,
  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
    gap: 0.65rem;
    align-items: start;
  }

  .header {
    color: var(--mlf-series-heading, var(--mlf-color-text-muted, #475569));
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .row {
    min-width: 0;
  }

  .cell {
    min-width: 0;
  }

  .cell-label {
    display: none;
  }

  .cell select,
  .cell input {
    height: var(--mlf-series-control-height);
    min-height: 0;
    padding-block: 0;
  }

  .select-wrap {
    position: relative;
    min-width: 0;
  }

  .select-wrap select {
    padding-right: 2.8rem;
    appearance: none;
  }

  .chevron {
    position: absolute;
    top: 50%;
    right: 0.9rem;
    width: 14px;
    height: 14px;
    transform: translateY(-50%);
    color: var(--mlf-category-chevron-color, var(--mlf-color-text-muted, #475569));
    pointer-events: none;
  }

  .chevron svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  .value-wrap {
    position: relative;
  }

  .value-wrap input {
    padding-right: calc(var(--mlf-series-unit-width, 2rem) + 2rem);
    white-space: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    appearance: textfield;
  }

  .value-wrap input::-webkit-inner-spin-button,
  .value-wrap input::-webkit-outer-spin-button {
    appearance: none;
  }

  .value-wrap.is-disabled .unit {
    opacity: 0.72;
    --mlf-series-unit-bg: var(--mlf-input-bg-disabled, var(--mlf-color-surface-muted, #f5f7fa));
  }

  .value-wrap.is-readonly .unit {
    --mlf-series-unit-bg: var(
      --mlf-input-bg-readonly,
      var(--mlf-input-bg-disabled, var(--mlf-color-surface-muted, #f5f7fa))
    );
  }

  .unit {
    position: absolute;
    top: 50%;
    right: 0.85rem;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    max-width: 40%;
    min-width: var(--mlf-series-unit-width, 2rem);
    padding-left: 0.65rem;
    overflow: hidden;
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--mlf-series-unit-bg, var(--mlf-input-bg, #fff)) 0%, transparent),
      var(--mlf-series-unit-bg, var(--mlf-input-bg, #fff)) 45%
    );
    color: var(--mlf-series-unit-color, var(--mlf-color-text-muted, #475569));
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    pointer-events: none;
  }

  .unit:empty {
    display: none;
  }

  .empty {
    padding: 0.95rem 1rem;
    border-radius: 0.9rem;
    color: var(--mlf-series-empty-text, var(--mlf-color-text-muted, #475569));
    font-size: 0.9rem;
  }

  @container (max-width: 32rem) {
    .header {
      display: none;
    }

    .row {
      grid-template-columns: 1fr;
    }

    .cell-label {
      display: block;
      margin-block-end: 0.3rem;
      color: var(--mlf-series-heading, var(--mlf-color-text-muted, #475569));
      font-size: 0.78rem;
      font-weight: 600;
    }

    .remove-btn {
      justify-self: end;
    }
  }
`;
