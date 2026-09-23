// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import { mountPrimitiveForm, type PrimitiveRegistry } from "@/primitives";
import type { FormViewController } from "@/view";
import type { MountFormOptions } from "../mount-types";
import type { resolveKitLabels } from "../defaults";

export const mountSinglePageForm = (
  container: HTMLElement,
  view: FormViewController,
  options: MountFormOptions,
  registry: PrimitiveRegistry,
  labels: ReturnType<typeof resolveKitLabels>,
) =>
  mountPrimitiveForm(container, view.form, {
    registry,
    descriptorRegistry: view.descriptorRegistry,
    layout: options.layout?.kind === "split" ? "split" : "stacked",
    formLabel: labels.form,
    reportsLabel: labels.reports,
    submitLabel: labels.submit,
    validatingLabel: labels.validating,
    submittingLabel: labels.submitting,
    reportPane: options.reportPane,
    text: options.primitiveText,
    reportTransport: options.reportTransport,
    reportFetchMode: options.reportFetchMode,
    submitHandler:
      options.reportFetchMode && options.reportFetchMode !== "lazy"
        ? async () => {
            const pipelineResult = await view.submitPipeline();
            return {
              result: pipelineResult.submitResult,
              pipelineResult,
            };
          }
        : undefined,
  });
