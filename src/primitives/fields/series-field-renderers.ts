// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { html } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import type { PrimitiveText } from "../constants";
import type { PrimitiveFieldRenderContext } from "../types";
import { toText } from "../utils";
import { seriesNumberUnit, type SeriesSubFieldConfig } from "./series-field-helpers";

export type RenderSeriesCellOptions = {
  config: SeriesSubFieldConfig;
  value: unknown;
  index: number;
  id: string;
  disabled: boolean;
  readOnly: boolean;
  field: 1 | 2;
  context: PrimitiveFieldRenderContext | undefined;
  text: PrimitiveText;
  onInput: (index: number, field: 1 | 2, value: unknown) => void;
  onBlur: () => void;
  label: string;
};

const renderSeriesSelectOption = (option: unknown, selected: string) => {
  const normalized = typeof option === "string" ? { label: option, value: option } : option;
  if (!normalized || typeof normalized !== "object") {
    return null;
  }

  const item = normalized as { label?: unknown; value?: unknown };
  return html`
    <option value=${String(item.value)} ?selected=${String(item.value) === selected}>
      ${String(item.label)}
    </option>
  `;
};

const renderSeriesTextValue = (value: unknown): string => {
  return typeof value === "string"
    ? value
    : typeof value === "number" || typeof value === "boolean" || typeof value === "bigint"
      ? `${value}`
      : "";
};

export const renderSeriesCell = ({
  config,
  value,
  index,
  id,
  disabled,
  readOnly,
  field,
  context,
  text,
  onInput,
  onBlur,
  label,
}: RenderSeriesCellOptions) => {
  const required = Boolean(config.required);
  switch (config.kind) {
    case "date":
      return html`
        <input
          class="control"
          id=${id}
          type="date"
          .value=${typeof value === "string" ? value : ""}
          aria-label=${label}
          aria-describedby=${ifDefined(context?.describedBy)}
          aria-invalid=${String(context?.invalid ?? false)}
          ?required=${required}
          ?disabled=${disabled}
          ?readonly=${readOnly}
          min=${ifDefined(typeof config.min === "string" ? config.min : undefined)}
          max=${ifDefined(typeof config.max === "string" ? config.max : undefined)}
          @input=${(event: Event) =>
            onInput(index, field, (event.target as HTMLInputElement).value)}
          @blur=${onBlur}
        />
      `;
    case "category": {
      const options = Array.isArray(config.options) ? config.options : [];
      const selected = typeof value === "string" ? value : "";
      return html`
        <select
          class="control"
          id=${id}
          aria-label=${label}
          aria-describedby=${ifDefined(context?.describedBy)}
          aria-invalid=${String(context?.invalid ?? false)}
          ?required=${required}
          ?disabled=${Boolean(disabled || readOnly)}
          @change=${(event: Event) =>
            onInput(index, field, (event.target as HTMLSelectElement).value)}
          @blur=${onBlur}
        >
          <option value="" ?selected=${selected === ""}>
            &#8212; ${text.categoryPlaceholder} &#8212;
          </option>
          ${options.map((option) => renderSeriesSelectOption(option, selected))}
        </select>
      `;
    }
    case "boolean": {
      const trueLabel = toText(config.trueLabel, text.booleanTrue);
      const falseLabel = toText(config.falseLabel, text.booleanFalse);
      const selected = value === true ? "true" : value === false ? "false" : "";
      return html`
        <select
          class="control"
          id=${id}
          aria-label=${label}
          aria-describedby=${ifDefined(context?.describedBy)}
          aria-invalid=${String(context?.invalid ?? false)}
          ?required=${required}
          ?disabled=${Boolean(disabled || readOnly)}
          @change=${(event: Event) => {
            const next = (event.target as HTMLSelectElement).value;
            onInput(index, field, next === "" ? "" : next === "true");
          }}
          @blur=${onBlur}
        >
          <option value="" ?selected=${selected === ""}>&#8212; Select &#8212;</option>
          <option value="true" ?selected=${selected === "true"}>${trueLabel}</option>
          <option value="false" ?selected=${selected === "false"}>${falseLabel}</option>
        </select>
      `;
    }
    case "number": {
      const unit = seriesNumberUnit(config);
      return html`
        <div class="value-wrap">
          <input
            class="control"
            id=${id}
            type="text"
            inputmode="decimal"
            spellcheck="false"
            autocomplete="off"
            .value=${typeof value === "string" ? value : ""}
            placeholder=${toText(config.placeholder)}
            aria-label=${label}
            aria-describedby=${ifDefined(context?.describedBy)}
            aria-invalid=${String(context?.invalid ?? false)}
            aria-valuemin=${ifDefined(typeof config.min === "number" ? config.min : undefined)}
            aria-valuemax=${ifDefined(typeof config.max === "number" ? config.max : undefined)}
            ?required=${required}
            ?disabled=${disabled}
            ?readonly=${readOnly}
            @input=${(event: Event) =>
              onInput(index, field, (event.target as HTMLInputElement).value)}
            @blur=${onBlur}
          />
          <span class="unit" aria-hidden="true">${unit}</span>
        </div>
      `;
    }
    default:
      return html`
        <input
          class="control"
          id=${id}
          type="text"
          .value=${renderSeriesTextValue(value)}
          placeholder=${toText(config.placeholder)}
          aria-label=${label}
          aria-describedby=${ifDefined(context?.describedBy)}
          aria-invalid=${String(context?.invalid ?? false)}
          ?required=${required}
          ?disabled=${disabled}
          ?readonly=${readOnly}
          @input=${(event: Event) =>
            onInput(index, field, (event.target as HTMLInputElement).value)}
          @blur=${onBlur}
        />
      `;
  }
};
