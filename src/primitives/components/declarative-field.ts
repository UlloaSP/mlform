// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { css } from "lit";
import { customElement } from "lit/decorators.js";
import { html, unsafeStatic } from "lit/static-html.js";
import { PrimitiveFieldElement } from "../base-field-element";
import { primitiveTagNames } from "../constants";

const widgetToComponent = {
  text: {
    component: "text-field",
    tagName: primitiveTagNames.textField,
  },
  number: {
    component: "number-field",
    tagName: primitiveTagNames.numberField,
  },
  boolean: {
    component: "boolean-field",
    tagName: primitiveTagNames.booleanField,
  },
  select: {
    component: "category-field",
    tagName: primitiveTagNames.categoryField,
  },
  date: {
    component: "date-field",
    tagName: primitiveTagNames.dateField,
  },
  series: {
    component: "series-field",
    tagName: primitiveTagNames.seriesField,
  },
} as const;

type DeclarativeWidget = keyof typeof widgetToComponent;

@customElement(primitiveTagNames.declarativeField)
export class PrimitiveDeclarativeFieldElement extends PrimitiveFieldElement {
  static styles = [
    PrimitiveFieldElement.styles,
    css`
      :host {
        display: block;
      }
    `,
  ];

  render() {
    const widget = this.#resolveWidget();

    if (!widget) {
      return this.renderAssistiveText();
    }

    const target = widgetToComponent[widget];
    const tag = unsafeStatic(target.tagName);
    const descriptor = {
      component: target.component,
      props: this.#createChildProps(widget),
    };

    return html`
      <${tag}
        .controller=${this.controller}
        .descriptor=${descriptor}
        .context=${this.context}
        .text=${this.text}
      ></${tag}>
    `;
  }

  #resolveWidget(): DeclarativeWidget | null {
    const widget = this.props.widget;
    return typeof widget === "string" && widget in widgetToComponent
      ? (widget as DeclarativeWidget)
      : null;
  }

  #createChildProps(widget: DeclarativeWidget): Record<string, unknown> {
    const props = { ...this.props };
    delete props.widget;

    if (widget === "boolean") {
      props.checked = props.value === true ? true : props.value === false ? false : null;
    }

    return props;
  }
}
