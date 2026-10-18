import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { mountForm, type MountFormOptions } from "@/kit";
import { builtinDesignSystemRegistry } from "@/design";
import { flush, getShadow } from "./kit-integration-helpers";

const mounts: ReturnType<typeof mountForm>[] = [];
afterEach(() => {
  mounts.splice(0).forEach((mounted) => mounted.unmount());
  document.body.replaceChildren();
});
const mount = (options: Partial<MountFormOptions> = {}) => {
  const container = document.createElement("div");
  document.body.append(container);
  const mounted = mountForm(container, {
    schema: { fields: [{ id: "name", kind: "text", label: "Name", mappedTo: "name" }] },
    transport: { submit: async () => ({ reports: [] }) },
    ...options,
  });
  mounts.push(mounted);
  return mounted;
};
const fields = [{ kind: "field", field: "name" }] as const;
const layouts: [string, MountFormOptions["layout"]][] = [
  ["default", undefined],
  ["split", { kind: "split" }],
  ["explicit stacked", { kind: "stacked", children: [...fields] }],
  ["explicit split", { kind: "split", children: [...fields] }],
  ["tabs", { kind: "tabs", tabs: [{ id: "input", title: "Input", children: [...fields] }] }],
  ["wizard", { kind: "wizard", steps: [{ id: "input", title: "Input", children: [...fields] }] }],
];

const clickSubmit = async (mounted: ReturnType<typeof mountForm>) => {
  await flush();
  const root = getShadow(mounted.host);
  const primitive = root.querySelector("mlf-submit-button");
  const button = primitive
    ? getShadow(primitive).querySelector("button")
    : root.querySelector(".btn-submit");
  expect(button).not.toBeNull();
  button!.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
};

describe("mounted layout contracts", () => {
  it.each(layouts)("emits one submission lifecycle for %s controls", async (_, layout) => {
    const mounted = mount({ layout });
    const start = vi.fn();
    const success = vi.fn();
    mounted.host.addEventListener("mlf-submit-start", start);
    mounted.host.addEventListener("mlf-submit-success", success);
    await clickSubmit(mounted);
    await vi.waitFor(() => expect(success).toHaveBeenCalledTimes(1));
    expect(start).toHaveBeenCalledTimes(1);
    expect(success.mock.calls[0][0].detail).toMatchObject({
      form: mounted.form,
      result: { modelValues: { name: "" } },
    });
  });

  it.each(layouts)(
    "emits validation errors from %s without calling the transport",
    async (_, layout) => {
      const submit = vi.fn();
      const mounted = mount({
        layout,
        transport: { submit },
        schema: {
          fields: [{ id: "name", kind: "text", label: "Name", required: true }],
        },
      });
      const error = vi.fn();
      const success = vi.fn();
      mounted.host.addEventListener("mlf-submit-error", error);
      mounted.host.addEventListener("mlf-submit-success", success);
      await clickSubmit(mounted);
      await vi.waitFor(() => expect(error).toHaveBeenCalledTimes(1));
      expect(error.mock.calls[0][0].detail.error.name).toBe("ValidationError");
      expect(submit).not.toHaveBeenCalled();
      expect(success).not.toHaveBeenCalled();
    },
  );

  it.each(layouts)("emits abort from %s without an error or success event", async (_, layout) => {
    const mounted = mount({
      layout,
      transport: {
        submit: ({ signal }) =>
          new Promise((_, reject) => {
            signal?.addEventListener(
              "abort",
              () => reject(new DOMException("Cancelled", "AbortError")),
              { once: true },
            );
          }),
      },
    });
    const abort = vi.fn();
    const error = vi.fn();
    const success = vi.fn();
    mounted.host.addEventListener("mlf-submit-abort", abort);
    mounted.host.addEventListener("mlf-submit-error", error);
    mounted.host.addEventListener("mlf-submit-success", success);
    await clickSubmit(mounted);
    await vi.waitFor(() => expect(mounted.form.state.operation).toBe("submitting"));
    mounted.form.abortSubmit();
    await vi.waitFor(() => expect(abort).toHaveBeenCalledTimes(1));
    expect(abort.mock.calls[0][0].detail.status).toBe("aborted");
    expect(error).not.toHaveBeenCalled();
    expect(success).not.toHaveBeenCalled();
  });

  it.each(layouts)("includes pipeline results when %s fetches all reports", async (_, layout) => {
    const mounted = mount({ layout, reportFetchMode: "all" });
    const success = vi.fn();
    mounted.host.addEventListener("mlf-submit-success", success);
    await clickSubmit(mounted);
    await vi.waitFor(() => expect(success).toHaveBeenCalledTimes(1));
    expect(success.mock.calls[0][0].detail.pipelineResult).toMatchObject({
      reportFetchResults: {},
      reportFetchErrors: {},
    });
  });

  it("exposes the registry actually attached to this form", () => {
    const registry = builtinDesignSystemRegistry.clone();
    const mounted = mount({ designSystemRegistry: registry });
    const other = mount({ designSystemRegistry: registry });
    expect(mounted.designSystemRegistry).toBe(mounted.designSystem.registry);
    mounted.designSystemRegistry.registerTheme({
      id: "local",
      label: "Local",
      schemes: { light: { tokens: { "--mlf-color-accent": "#123456" } } },
    });
    mounted.updateDesignSystem({ theme: "local", mode: "light" });
    expect(mounted.host.style.getPropertyValue("--mlf-color-accent")).toBe("#123456");
    expect(registry.getTheme("local")).toBeUndefined();
    expect(other.designSystemRegistry.getTheme("local")).toBeUndefined();
  });

  it("omits section counts for layouts without sections and uses the singular", async () => {
    const plain = mount({ layout: { kind: "stacked", children: [...fields] } });
    const section = mount({
      layout: {
        kind: "stacked",
        children: [{ kind: "section", id: "details", title: "Details", children: [...fields] }],
      },
    });
    await flush();
    expect(getShadow(plain.host).querySelector("footer")?.textContent).not.toContain(
      "sections open",
    );
    expect(getShadow(section.host).querySelector("footer")?.textContent).toContain(
      "1 section open",
    );
    getShadow(section.host).querySelector<HTMLButtonElement>(".section-toggle")!.click();
    await flush();
    expect(getShadow(section.host).querySelector("footer")?.textContent).toContain(
      "0 sections open",
    );
  });
});
