// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it } from "vite-plus/test";
import { resolveOneHotDisplayValue } from "@/schema";

describe("onehot display helper", () => {
  it("resolves selected option value from one-hot model values", () => {
    const value = resolveOneHotDisplayValue(
      {
        id: "color",
        kind: "onehot-category",
        options: [
          { label: "Red", value: "red", mappedTo: "is_red" },
          { label: "Green", value: "green", mappedTo: "is_green" },
        ],
      },
      { is_red: 0, is_green: 1 },
    );

    expect(value).toBe("green");
  });

  it("resolves backend-specific numeric targets from keyed model values", () => {
    const value = resolveOneHotDisplayValue(
      {
        id: "color",
        kind: "onehot-category",
        options: [
          { label: "Red", value: "red", mappedTo: { default: "is_red", remote: 0 } },
          { label: "Green", value: "green", mappedTo: { default: "is_green", remote: 1 } },
        ],
      },
      { "0": 1, "1": 0 },
      { backend: "remote" },
    );

    expect(value).toBe("red");
  });

  it("returns undefined when no option is selected", () => {
    expect(
      resolveOneHotDisplayValue(
        {
          id: "color",
          kind: "onehot-category",
          options: [{ label: "Red", value: "red", mappedTo: "is_red" }],
        },
        { is_red: 0 },
      ),
    ).toBeUndefined();
  });

  it("rejects invalid one-hot mappings and values", () => {
    expect(() =>
      resolveOneHotDisplayValue(
        {
          id: "color",
          kind: "onehot-category",
          options: [{ label: "Red", value: "red" }],
        },
        {},
      ),
    ).toThrow(/has no mappedTo/);

    expect(() =>
      resolveOneHotDisplayValue(
        {
          id: "color",
          kind: "onehot-category",
          options: [
            { label: "Red", value: "red", mappedTo: "is_color" },
            { label: "Green", value: "green", mappedTo: "is_color" },
          ],
        },
        { is_color: 1 },
      ),
    ).toThrow(/duplicate mappedTo/);

    expect(() =>
      resolveOneHotDisplayValue(
        {
          id: "color",
          kind: "onehot-category",
          options: [
            { label: "Red", value: "red", mappedTo: "is_red" },
            { label: "Green", value: "green", mappedTo: "is_green" },
          ],
        },
        { is_red: 1, is_green: 1 },
      ),
    ).toThrow(/multiple selected/);
  });
});
