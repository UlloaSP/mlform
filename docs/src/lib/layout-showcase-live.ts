import { mountAccordionForm, mountForm, mountTabsForm, mountWizardForm } from "@/kit";

import {
  accordionLayout,
  cleanupSymbol,
  createDemoTransport,
  schema,
  tabsLayout,
  type Cleanup,
  type ShowcaseLocale,
  wizardLayout,
} from "./layout-showcase-config";
import { mountCustomHeadless } from "./layout-showcase-custom";

type ShowcaseRoot = HTMLElement & {
  [cleanupSymbol]?: Cleanup;
};

const resolveHost = (root: HTMLElement, id: string): HTMLElement | null =>
  root.querySelector<HTMLElement>(`[data-layout-showcase-host="${id}"]`);

export const mountLayoutShowcase = (root: HTMLElement, locale: ShowcaseLocale = "en"): Cleanup => {
  const showcaseRoot = root as ShowcaseRoot;
  showcaseRoot[cleanupSymbol]?.();

  const cleanups: Cleanup[] = [];

  const onePageHost = resolveHost(root, "one-page");
  if (onePageHost) {
    const mounted = mountForm(onePageHost, {
      schema,
      transport: createDemoTransport(),
    });
    cleanups.push(() => mounted.unmount());
  }

  const wizardHost = resolveHost(root, "wizard");
  if (wizardHost) {
    const mounted = mountWizardForm(wizardHost, {
      schema,
      transport: createDemoTransport(),
      layout: wizardLayout,
    });
    cleanups.push(() => mounted.unmount());
  }

  const tabsHost = resolveHost(root, "tabs");
  if (tabsHost) {
    const mounted = mountTabsForm(tabsHost, {
      schema,
      transport: createDemoTransport(),
      layout: tabsLayout,
    });
    cleanups.push(() => mounted.unmount());
  }

  const accordionHost = resolveHost(root, "accordion");
  if (accordionHost) {
    const mounted = mountAccordionForm(accordionHost, {
      schema,
      transport: createDemoTransport(),
      layout: accordionLayout,
    });
    cleanups.push(() => mounted.unmount());
  }

  const customHost = resolveHost(root, "custom");
  if (customHost) {
    cleanups.push(mountCustomHeadless(customHost, locale));
  }

  const cleanup = (): void => {
    while (cleanups.length > 0) {
      cleanups.pop()?.();
    }
    if (showcaseRoot[cleanupSymbol] === cleanup) {
      delete showcaseRoot[cleanupSymbol];
    }
  };

  showcaseRoot[cleanupSymbol] = cleanup;
  return cleanup;
};
