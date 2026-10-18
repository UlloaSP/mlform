import { mountForm } from "mlform";
import { createDemoTransport, layouts, schema, type Cleanup } from "./layout-showcase-config";
import { mountCustomHeadless } from "./layout-showcase-custom";

type Variant = keyof typeof layouts | "custom";

const mountVariant = (host: HTMLElement, variant: Variant): Cleanup => {
  if (variant === "custom") return mountCustomHeadless(host);
  const mounted = mountForm(host, {
    schema,
    transport: createDemoTransport(),
    layout: layouts[variant],
    designSystem: { theme: "eshkra" },
  });
  return () => mounted.unmount();
};

export const mountLayoutShowcase = (root: HTMLElement): Cleanup => {
  const cleanups = [...root.querySelectorAll<HTMLElement>("[data-layout-showcase-host]")].map(
    (host) => mountVariant(host, host.dataset.layoutShowcaseHost as Variant),
  );
  return () => {
    for (const cleanup of cleanups) cleanup();
  };
};
