// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { attachDesignSystem } from "@/design-system";
import { createBuiltinRegistry, createForm } from "@/engine";
import { mountForm } from "@/primitives";

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
};

describe("design-system integration", () => {
  it("applies tokens, supports patch vs replace semantics, and restores host state on disconnect", async () => {
    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Prompt", required: true }],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    const container = document.createElement("div");
    document.body.append(container);
    const mounted = mountForm(container, form);
    mounted.host.setAttribute("theme-id", "manual");
    mounted.host.style.setProperty("--mlf-color-accent", "#101010");
    mounted.host.style.setProperty("--mlf-custom-surface-glow", "initial-glow");
    mounted.host.style.colorScheme = "dark";
    const attached = attachDesignSystem(mounted.host, {
      config: {
        theme: "cobalt",
        recipe: "minimal",
      },
    });

    await flush();

    expect(mounted.host.getAttribute("theme-id")).toBe("cobalt");
    expect(mounted.host.getAttribute("recipe-id")).toBe("minimal");
    expect(mounted.host.style.getPropertyValue("--mlf-color-accent")).toBe("#1f5eff");
    expect(attached.config.theme).toBe("cobalt");

    attached.update({
      theme: "sunset",
      overrides: {
        tokens: {
          "--mlf-color-accent": "#663399",
          "--mlf-custom-surface-glow": "active-glow",
        },
      },
    });

    await flush();

    expect(mounted.host.getAttribute("theme-id")).toBe("sunset");
    expect(mounted.host.style.getPropertyValue("--mlf-color-accent")).toBe("#663399");
    expect(mounted.host.style.getPropertyValue("--mlf-custom-surface-glow")).toBe("active-glow");

    attached.replace({
      theme: "graphite",
      recipe: "default",
    });

    await flush();

    expect(mounted.host.getAttribute("theme-id")).toBe("graphite");
    expect(mounted.host.getAttribute("recipe-id")).toBe("default");
    expect(mounted.host.style.getPropertyValue("--mlf-color-accent")).toBe("#375a7f");
    expect(mounted.host.style.getPropertyValue("--mlf-custom-surface-glow")).toBe("initial-glow");

    attached.reset();

    await flush();

    expect(mounted.host.getAttribute("theme-id")).toBe("cobalt");
    expect(mounted.host.getAttribute("recipe-id")).toBe("minimal");
    expect(mounted.host.style.getPropertyValue("--mlf-color-accent")).toBe("#1f5eff");

    attached.disconnect();

    expect(mounted.host.getAttribute("theme-id")).toBe("manual");
    expect(mounted.host.getAttribute("recipe-id")).toBeNull();
    expect(mounted.host.getAttribute("data-mlf-scheme")).toBeNull();
    expect(mounted.host.style.getPropertyValue("--mlf-color-accent")).toBe("#101010");
    expect(mounted.host.style.getPropertyValue("--mlf-custom-surface-glow")).toBe("initial-glow");
    expect(mounted.host.style.colorScheme).toBe("dark");

    mounted.unmount();
    container.remove();
  });

  it("reacts to inherited and system scheme changes", async () => {
    window.__setPreferredColorScheme?.("light");

    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Prompt" }],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    const container = document.createElement("div");
    container.setAttribute("data-color-scheme", "light");
    document.body.append(container);
    const mounted = mountForm(container, form);

    const inherited = attachDesignSystem(mounted.host, {
      config: {
        mode: "inherit",
        theme: "graphite",
      },
    });

    await flush();
    expect(mounted.host.getAttribute("effective-scheme")).toBe("light");

    container.setAttribute("data-color-scheme", "dark");
    await flush();
    await flush();

    expect(mounted.host.getAttribute("effective-scheme")).toBe("dark");

    inherited.disconnect();

    const auto = attachDesignSystem(mounted.host, {
      config: {
        mode: "auto",
        theme: "cobalt",
      },
    });

    await flush();
    expect(mounted.host.getAttribute("effective-scheme")).toBe("light");

    window.__setPreferredColorScheme?.("dark");
    await flush();
    await flush();

    expect(mounted.host.getAttribute("effective-scheme")).toBe("dark");
    expect(auto.resolved?.effectiveModeSource).toBe("system");

    auto.disconnect();
    mounted.unmount();
    container.remove();
  });

  it("inherits the resolved scheme from a parent design-system host", async () => {
    const form = createForm({
      schema: {
        fields: [{ kind: "text", label: "Prompt" }],
      },
      registry: createBuiltinRegistry(),
      transport: {
        submit: vi.fn(),
      },
    });

    const outer = document.createElement("section");
    const container = document.createElement("div");
    outer.append(container);
    document.body.append(outer);

    const parent = attachDesignSystem(outer, {
      config: {
        theme: "graphite",
        mode: "dark",
      },
    });
    const mounted = mountForm(container, form);
    const child = attachDesignSystem(mounted.host, {
      config: {
        theme: "cobalt",
        mode: "inherit",
      },
    });

    await flush();

    expect(outer.getAttribute("data-mlf-scheme")).toBe("dark");
    expect(mounted.host.getAttribute("effective-scheme")).toBe("dark");
    expect(child.resolved?.effectiveModeSource).toBe("host-attribute");

    parent.replace({
      theme: "cobalt",
      mode: "light",
    });

    await flush();
    await flush();

    expect(outer.getAttribute("data-mlf-scheme")).toBe("light");
    expect(mounted.host.getAttribute("effective-scheme")).toBe("light");

    child.disconnect();
    parent.disconnect();
    mounted.unmount();
    outer.remove();
  });
});
