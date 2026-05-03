// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css } from "lit";

export const seriesFieldStyles = css`
  .series {
    display: grid;
    gap: 0.9rem;
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
    line-height: 1;
    cursor: pointer;
    transition:
      background 0.2s ease,
      border-color 0.2s ease,
      transform 0.2s ease;
  }

  .add-btn {
    padding: 0.7rem 1rem;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  .remove-btn {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.8rem;
    font-size: 1.15rem;
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

  .add-btn:disabled,
  .remove-btn:disabled {
    cursor: not-allowed;
    opacity: 0.65;
    transform: none;
  }

  .grid {
    display: grid;
    gap: 0.65rem;
  }

  .header,
  .row {
    display: grid;
    grid-template-columns: minmax(10rem, 1fr) minmax(10rem, 1fr) auto;
    gap: 0.65rem;
    align-items: start;
  }

  .header {
    padding: 0 0.15rem;
    color: var(--mlf-series-heading, var(--mlf-color-text-muted, #475569));
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .row {
    padding: 0.55rem;
    border-radius: 1rem;
    background: var(
      --mlf-series-row-bg,
      color-mix(in srgb, var(--mlf-color-surface, #ffffff) 80%, var(--mlf-color-bg-light, #f8fafc))
    );
    border: var(--mlf-border-width, 1px) solid
      var(
        --mlf-series-row-border,
        color-mix(in srgb, var(--mlf-color-border, #e2e8f0) 90%, transparent)
      );
  }

  .cell {
    min-width: 0;
  }

  .cell select,
  .cell input {
    min-height: var(--mlf-control-height, 3rem);
  }

  .value-wrap {
    position: relative;
  }

  .value-wrap input {
    padding-right: calc(var(--mlf-series-unit-width, 2rem) + 1.8rem);
  }

  .unit {
    position: absolute;
    top: 50%;
    right: 0.85rem;
    transform: translateY(-50%);
    max-width: 42%;
    overflow: hidden;
    color: var(--mlf-series-unit-color, var(--mlf-color-text-muted, #475569));
    font-size: 0.82rem;
    font-weight: 700;
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
    border: 1px dashed var(--mlf-series-empty-border, var(--mlf-color-border, #cbd5e1));
    color: var(--mlf-series-empty-text, var(--mlf-color-text-muted, #475569));
    font-size: 0.9rem;
  }

  @media (max-width: 640px) {
    .header {
      display: none;
    }

    .row {
      grid-template-columns: 1fr;
    }

    .remove-btn {
      justify-self: end;
    }
  }
`;
