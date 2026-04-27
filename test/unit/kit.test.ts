// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it, vi } from "vite-plus/test";
import { defaultKitDesignSystem, defaultKitLabels, unmountForm } from "@/kit";

describe("kit", () => {
  it("exposes stable default labels", () => {
    expect(defaultKitLabels).toMatchObject({
      form: expect.any(String),
      reports: expect.any(String),
      submit: expect.any(String),
      validating: expect.any(String),
      submitting: expect.any(String),
    });
  });

  it("exposes stable default design system", () => {
    expect(defaultKitDesignSystem).toEqual({
      mode: "auto",
      theme: "neutral",
      recipe: "default",
    });
  });

  it("delegates unmountForm to mounted instance", () => {
    const mounted = {
      unmount: vi.fn(),
    };

    unmountForm(mounted as never);

    expect(mounted.unmount).toHaveBeenCalledTimes(1);
  });
});
