// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { describe, expect, it } from "vite-plus/test";
import { createMlRegistryPack } from "@/builtins";
import { createForm, createSubmissionSnapshot } from "@/runtime";
import type { InactiveFieldPolicy } from "@/schema";

const createHiddenOneHotForm = () =>
  createForm({
    schema: {
      fields: [
        {
          id: "ui_color",
          kind: "onehot-category",
          label: "Color",
          displayKey: "color",
          hidden: true,
          defaultValue: "green",
          options: [
            { label: "Red", value: "red", mappedTo: "is_red" },
            { label: "Green", value: "green", mappedTo: "is_green" },
          ],
        },
      ],
    },
    registry: createMlRegistryPack().registry,
    transport: { submit: async () => ({ reports: {} }) },
  });

describe("onehot-category inactive submission policy", () => {
  it("includes hidden one-hot model values only when policy is include", () => {
    const snapshot = createSubmissionSnapshot(createHiddenOneHotForm(), {
      inactiveFieldPolicy: "include",
    });

    expect(snapshot.displayValues).toEqual({});
    expect(snapshot.modelValues).toEqual({ is_red: 0, is_green: 1 });
    expect(snapshot.inputs).toEqual([
      expect.objectContaining({
        fieldId: "ui-color",
        displayKey: "color",
        value: "green",
        modelValues: { is_red: 0, is_green: 1 },
        visible: false,
      }),
    ]);
  });

  it.each(["omit", "reset-on-hide"] satisfies InactiveFieldPolicy[])(
    "omits hidden one-hot values when policy is %s",
    (inactiveFieldPolicy) => {
      const snapshot = createSubmissionSnapshot(createHiddenOneHotForm(), {
        inactiveFieldPolicy,
      });

      expect(snapshot.inputs).toEqual([]);
      expect(snapshot.displayValues).toEqual({});
      expect(snapshot.modelValues).toEqual({});
      expect(snapshot.serializedValues).toEqual({});
    },
  );
});
