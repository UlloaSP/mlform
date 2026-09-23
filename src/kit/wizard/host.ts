// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import "./root";
import { kitTagNames } from "../constants";
import {
  configureLayoutHost,
  createRegisteredHost,
  type LayoutHostContext,
} from "../shared/host-config";
import { defaultWizardLabels, resolveWizardText } from "./labels";
import type { KitWizardElement } from "./root";

export const createWizardHost = (context: LayoutHostContext): KitWizardElement => {
  const host = configureLayoutHost(
    createRegisteredHost(context.ownerDocument, kitTagNames.wizard) as KitWizardElement,
    context,
  );
  const labels = { ...defaultWizardLabels, ...context.options.labels };
  host.labels = labels;
  host.text = resolveWizardText({
    stepLabel: context.labels.stepLabel,
    prevLabel: labels.prev,
    nextLabel: labels.next,
    submitLabel: labels.submit,
    validatingLabel: labels.validating,
    submittingLabel: labels.submitting,
  });
  return host;
};
