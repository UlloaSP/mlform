// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css } from "lit";

export const numberFieldStyles = css`
  .input-wrapper {
    position: relative;
    min-width: 0;
  }

  input {
    min-height: var(--mlf-control-height, 3rem);
    padding-right: min(calc(var(--mlf-number-unit-width, 2rem) + 2rem), calc(40% + 2rem));
    white-space: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    text-overflow: clip;
    -webkit-overflow-scrolling: touch;
    appearance: textfield;
  }

  .unit {
    position: absolute;
    top: 50%;
    right: 0.85rem;
    transform: translateY(-50%);
    display: block;
    text-align: right;
    max-width: 40%;
    min-width: min(var(--mlf-number-unit-width, 2rem), 40%);
    overflow: hidden;
    text-overflow: ellipsis;
    padding-left: 0.65rem;
    background: linear-gradient(
      90deg,
      color-mix(
          in srgb,
          var(--mlf-number-overlay-bg, var(--mlf-input-bg, var(--mlf-color-surface, #ffffff))) 0%,
          transparent
        )
        0%,
      var(--mlf-number-overlay-bg, var(--mlf-input-bg, var(--mlf-color-surface, #ffffff))) 45%
    );
    color: var(--mlf-number-unit-color, var(--mlf-color-text-muted, #475569));
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1.5;
    padding-block: 2px;
    white-space: nowrap;
    pointer-events: none;
  }

  .input-wrapper.is-disabled .unit {
    opacity: 0.72;
    --mlf-number-overlay-bg: var(--mlf-input-bg-disabled, var(--mlf-color-surface-muted, #f5f7fa));
  }

  .input-wrapper.is-readonly .unit {
    --mlf-number-overlay-bg: var(
      --mlf-input-bg-readonly,
      var(--mlf-input-bg-disabled, var(--mlf-color-surface-muted, #f5f7fa))
    );
  }

  .unit:empty {
    display: none;
  }

  .range-wrapper {
    display: grid;
    gap: 0.75rem;
  }

  .range-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    min-width: 0;
  }

  .range-value {
    color: var(--mlf-number-unit-color, var(--mlf-color-text-muted, #475569));
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1.2;
    text-align: right;
  }

  input[type="range"].control {
    min-height: auto;
    padding: 0;
    border: none;
    border-radius: 999px;
    background: transparent;
    box-shadow: none;
    appearance: none;
    cursor: pointer;
  }

  input[type="range"].control:focus-visible {
    outline: 2px solid var(--mlf-input-border-focus, var(--mlf-color-accent));
    outline-offset: 5px;
    box-shadow: none;
  }

  input[type="range"].control:disabled {
    background: transparent;
    cursor: not-allowed;
    --mlf-range-thumb: var(--mlf-color-text-muted, #526170);
    opacity: 0.65;
  }

  input[type="range"].control:disabled[aria-readonly="true"] {
    cursor: default;
  }

  input[type="range"].control::-webkit-slider-runnable-track {
    height: 0.4rem;
    border-radius: 999px;
    background: var(--mlf-range-track, var(--mlf-color-border, #d1d5db));
  }

  input[type="range"].control::-moz-range-track {
    height: 0.4rem;
    border-radius: 999px;
    background: var(--mlf-range-track, var(--mlf-color-border, #d1d5db));
  }

  input[type="range"].control::-webkit-slider-thumb {
    width: 1.1rem;
    height: 1.1rem;
    margin-top: -0.35rem;
    border: 2px solid var(--mlf-range-thumb-border, #ffffff);
    border-radius: 50%;
    background: var(--mlf-range-thumb, var(--mlf-color-accent, #1e40af));
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.2);
    appearance: none;
  }

  input[type="range"].control::-moz-range-thumb {
    width: 1.1rem;
    height: 1.1rem;
    border: 2px solid var(--mlf-range-thumb-border, #ffffff);
    border-radius: 50%;
    background: var(--mlf-range-thumb, var(--mlf-color-accent, #1e40af));
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.2);
  }

  input[type="range"].control:focus-visible::-webkit-slider-thumb {
    box-shadow: var(--mlf-input-shadow-focus, 0 0 0 4px rgba(29, 78, 216, 0.18));
  }

  input[type="range"].control:focus-visible::-moz-range-thumb {
    box-shadow: var(--mlf-input-shadow-focus, 0 0 0 4px rgba(29, 78, 216, 0.18));
  }
`;
