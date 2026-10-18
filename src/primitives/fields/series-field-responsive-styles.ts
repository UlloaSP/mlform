// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css } from "lit";

export const seriesFieldResponsiveStyles = css`
  @container (max-width: 48rem) {
    .grid[data-columns="4"] .header {
      display: none;
    }
    .grid[data-columns="4"] .row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .grid[data-columns="4"] .cell-label {
      display: block;
      margin-block-end: 0.3rem;
    }
    .grid[data-columns="4"] .remove-btn {
      grid-column: -2;
      justify-self: end;
    }
  }

  @container (max-width: 38rem) {
    .grid[data-columns="3"] .header {
      display: none;
    }
    .grid[data-columns="3"] .row {
      grid-template-columns: 1fr;
    }
    .grid[data-columns="3"] .cell-label {
      display: block;
      margin-block-end: 0.3rem;
    }
    .grid[data-columns="3"] .remove-btn {
      justify-self: end;
    }
  }

  @container (max-width: 32rem) {
    .header {
      display: none;
    }

    .row,
    .grid[data-columns="4"] .row {
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

  .grid[data-columns="1"] .header,
  .grid[data-columns="1"] .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) var(--mlf-series-control-height);
  }
  .grid[data-columns="1"] .cell-label {
    display: none;
  }
`;
