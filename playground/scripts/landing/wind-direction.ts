import { css, html } from "lit";
import { PrimitiveFieldElement } from "mlform/primitives";
import { baseFieldConfigSchema, defineFieldDefinition } from "mlform/schema";
import type { MLFormFieldKind } from "mlform/view";
import { z } from "zod";

const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

// A compass rose of native radios, so arrow keys already move between points.
class WindDirectionField extends PrimitiveFieldElement {
  static styles = [
    PrimitiveFieldElement.styles,
    css`
      fieldset {
        display: grid;
        grid-template: "NW N NE" "W C E" "SW S SE" / 1fr 1fr 1fr;
        gap: 0.375rem;
        width: 11rem;
        margin: 0;
        padding: 0;
        border: 0;
      }
      label {
        display: grid;
        place-items: center;
        height: 2.25rem;
        border: 1px solid var(--mlf-color-border);
        border-radius: var(--mlf-radius-md);
        cursor: pointer;
      }
      label:has(:checked) {
        background: var(--mlf-color-accent);
        color: var(--mlf-color-text-inverse);
      }
      label:has(:focus-visible) {
        outline: 2px solid var(--mlf-color-focus-ring);
      }
      input {
        position: absolute;
        opacity: 0;
      }
      output {
        grid-area: C;
        place-self: center;
        color: var(--mlf-color-accent);
        font-size: 1.25rem;
      }
    `,
  ];

  render() {
    const value = this.props.value as string;
    const { controlId, describedBy } = this.getControlAttributes();
    return html`
      <fieldset aria-describedby=${describedBy ?? ""}>
        <legend class="sr-only">${this.context?.label}</legend>
        ${points.map(
          (point) => html`
            <label style="grid-area: ${point}">
              <input
                type="radio"
                name=${controlId ?? "wind-direction"}
                .checked=${value === point}
                @change=${() => this.commitValue(point)}
                @blur=${() => this.commitBlur()}
              />${point}
            </label>
          `,
        )}
        <output style="rotate: ${points.indexOf(value) * 45}deg">↑</output>
      </fieldset>
    `;
  }
}
customElements.define("wind-direction-field", WindDirectionField);

const definition = defineFieldDefinition({
  kind: "wind-direction",
  schema: baseFieldConfigSchema.extend({ kind: z.literal("wind-direction") }),
  getDefaultValue: () => "N",
  normalizeValue: (value) => (typeof value === "string" && points.includes(value) ? value : "N"),
  // The model receives degrees clockwise from north.
  serializeValue: (value) => points.indexOf(value as string) * 45,
});

export const windDirection: MLFormFieldKind = {
  category: "field",
  kind: "wind-direction",
  register(registry, descriptors) {
    registry.registerField(definition);
    descriptors.registerField({
      kind: "wind-direction",
      describe: (_config, { fieldId, state }) => ({
        component: "wind-direction-field",
        props: { id: fieldId, value: state.value },
      }),
    });
  },
};
