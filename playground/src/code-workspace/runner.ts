import * as kit from "mlform/kit";
import * as schema from "mlform/schema";
import * as runtime from "mlform/runtime";
import * as builtins from "mlform/builtins";
import * as primitives from "mlform/primitives";
import * as design from "mlform/design";
import * as view from "mlform/view";
import * as transport from "mlform/transport";
import * as lit from "lit";
import * as zod from "zod";
import "../../../brand/typography.css";
import "../theme-fonts.css";

let designSystem: design.DesignSystemConfig = {};
const attachment = design.attachDesignSystem(document.documentElement);
const mountedForms: { mounted: kit.MountedForm; explicit?: design.DesignSystemConfig }[] = [];
const mountForm: typeof kit.mountForm = (container, options) => {
  const mounted = kit.mountForm(container, {
    ...options,
    designSystem: design.mergeDesignSystemConfig(designSystem, options.designSystem),
  });
  mountedForms.push({ mounted, explicit: options.designSystem });
  return mounted;
};
const kitModule = { ...kit, mountForm };
const modules: Record<string, object> = {
  mlform: kitModule,
  "mlform/kit": kitModule,
  "mlform/schema": schema,
  "mlform/runtime": runtime,
  "mlform/builtins": builtins,
  "mlform/primitives": primitives,
  "mlform/design": design,
  "mlform/view": view,
  "mlform/transport": transport,
  lit,
  zod,
};
const requireModule = (name: string) => {
  if (!Object.hasOwn(modules, name)) {
    throw new Error(`Unavailable import: ${name}. Use mlform, its public subpaths, lit or zod.`);
  }
  return modules[name];
};
const result = (error?: unknown) =>
  window.parent.postMessage(
    {
      type: "mlform-code-result",
      ...(error === undefined
        ? {}
        : { error: error instanceof Error ? error.message : formatThrownValue(error) }),
    },
    "*",
  );
const formatThrownValue = (value: unknown): string => {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value) ?? "Error without a message";
  } catch {
    return "Error with an unserializable value";
  }
};
window.addEventListener("error", (event) => result(event.error ?? event.message));
window.addEventListener("unhandledrejection", (event) => result(event.reason));

window.addEventListener("message", async (event: MessageEvent) => {
  if (event.source !== window.parent || !event.data || typeof event.data !== "object") return;
  const data = event.data;
  if (data.type !== "mlform-code-run" && data.type !== "mlform-code-theme") return;
  try {
    designSystem = data.designSystem;
    attachment.update(designSystem);
    for (const { mounted, explicit } of mountedForms) {
      if (mounted.form.state.lifecycle !== "disposed") {
        mounted.updateDesignSystem(design.mergeDesignSystemConfig(designSystem, explicit));
      }
    }
    if (data.type === "mlform-code-run" && typeof data.code === "string") {
      const exports = {};
      const module = { exports };
      // User code runs only in this opaque-origin iframe, never in the playground document.
      // oxlint-disable-next-line typescript/no-implied-eval -- Executing edited TypeScript is the sandbox's purpose.
      const execute = new Function(
        "require",
        "exports",
        "module",
        `return (async () => {\n${data.code}\n})();\n//# sourceURL=mlform-example.js`,
      );
      await execute(requireModule, exports, module);
      await Promise.all(
        mountedForms.map(({ mounted }) =>
          "updateComplete" in mounted.host ? mounted.host.updateComplete : Promise.resolve(),
        ),
      );
      result();
    }
  } catch (error) {
    result(error);
  }
});
window.parent.postMessage({ type: "mlform-code-ready" }, "*");
