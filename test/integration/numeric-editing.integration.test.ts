import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { mountForm } from "mlform/kit";
import { flush, getShadow } from "./kit-integration-helpers";

describe("numeric editing without data loss", () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()));

  const mount = () => {
    const container = document.body.appendChild(document.createElement("div"));
    const mounted = mountForm(container, {
      schema: {
        fields: [
          { id: "number", kind: "number", label: "Number", mappedTo: "number" },
          {
            id: "range",
            kind: "number",
            label: "Range",
            min: 0,
            max: 1,
            step: 0.05,
            defaultValue: 0.75,
            mappedTo: "range",
          },
          {
            id: "series",
            kind: "series",
            label: "Series",
            mappedTo: "series",
            columns: [{ id: "value", kind: "number", label: "Value", required: true }],
            defaultValue: [{ value: 10 }, { value: 12 }],
          },
        ],
      },
      transport: { submit: vi.fn().mockResolvedValue({ reports: [] }) },
    });
    cleanups.push(() => {
      mounted.unmount();
      container.remove();
    });
    const renderer = (index: number, tag: string) =>
      getShadow(
        getShadow(
          getShadow(mounted.host).querySelectorAll("mlf-field-frame").item(index),
        ).querySelector(tag),
      );
    return { mounted, renderer };
  };

  for (const [index, tag] of [
    [0, "mlf-number-field"],
    [2, "mlf-series-field"],
  ] as const) {
    it.each(["0.00000001", "-0.005", "1e-8", "1.2500", "1000000000000000000000", "1,5"])(
      `preserves %s while typing and after blur in ${tag}`,
      async (text) => {
        const { mounted, renderer } = mount();
        await flush();
        const input = renderer(index, tag).querySelector("input")!;
        input.focus();
        for (let length = 1; length <= text.length; length++) {
          input.value = text.slice(0, length);
          input.dispatchEvent(new Event("input", { bubbles: true }));
          await flush();
          expect(input.value).toBe(text.slice(0, length));
        }
        input.blur();
        await flush();
        expect(input.value).toBe(text);
        const field = mounted.form.getField(index === 0 ? "number" : "series")!;
        const expected = Number(text.replace(",", "."));
        expect(field.state.value).toEqual(
          index === 0 ? expected : [{ value: expected }, { value: 12 }],
        );
        field.setValue(index === 0 ? 42 : [{ value: 42 }, { value: 12 }]);
        await flush();
        expect(input.value).toBe("42");
      },
    );
  }

  it("does not erase a range when focus leaves without editing", async () => {
    const { mounted, renderer } = mount();
    await flush();
    const range = renderer(1, "mlf-number-field").querySelector("input")!;
    range.focus();
    range.blur();
    await flush();
    expect(mounted.form.getField("range")?.state.value).toBe(0.75);
    expect(range.type).toBe("range");
  });

  it("marks only the invalid series cell and preserves other drafts", async () => {
    const { mounted, renderer } = mount();
    await flush();
    const root = renderer(2, "mlf-series-field");
    const inputs = root.querySelectorAll("input");
    inputs[1].value = "";
    inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
    await mounted.form.validate();
    await flush();
    expect(inputs[0].getAttribute("aria-invalid")).toBe("false");
    expect(inputs[1].getAttribute("aria-invalid")).toBe("true");
  });
});
