// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import "./primitives/register";

import { attachDesignSystem } from "@/design-system";
import { createForm } from "@/engine";
import { resolvePrimitiveText } from "@/primitives/constants";
import { questionnaireTagNames, resolveQuestionnaireText } from "./constants";
import {
  cloneQuestionnaireEngineRegistry,
  resolveQuestionnaireDesignSystem,
  resolveQuestionnaireDesignSystemRegistry,
  resolveQuestionnairePrimitiveRegistry,
} from "./defaults";
import { QuestionnaireController } from "./engine/controller";
import { normalizeQuestionnaireSchema } from "./engine/schema";
import type { MountQuestionnaireOptions, MountedQuestionnaire } from "./types";
import type { QuestionnaireRootElement } from "./primitives/components/questionnaire-root";

const mountedRef = Symbol("mlform.questionnaire.mounted");

type QuestionnaireContainer = HTMLElement & {
  [mountedRef]?: MountedQuestionnaire;
};

export const mountQuestionnaire = (
  container: HTMLElement,
  options: MountQuestionnaireOptions,
): MountedQuestionnaire => {
  const hostContainer = container as QuestionnaireContainer;
  hostContainer[mountedRef]?.unmount();

  // Registries
  const engineRegistry = cloneQuestionnaireEngineRegistry(options.registry);
  const primitiveRegistry = resolveQuestionnairePrimitiveRegistry(options.primitiveRegistry);
  const designSystemRegistry = resolveQuestionnaireDesignSystemRegistry(
    options.designSystemRegistry,
  );
  const initialDesignSystem = resolveQuestionnaireDesignSystem(options.designSystem);

  // Normalize schema → flat FormSchema + step metadata
  const { steps, formSchema } = normalizeQuestionnaireSchema(options.schema, engineRegistry);

  // Create headless FormController
  const form = createForm({
    schema: formSchema,
    registry: engineRegistry,
    transport: options.transport,
    initialValues: options.initialValues,
    validators: options.validators,
    hooks: options.hooks,
    inactiveFieldPolicy: options.inactiveFieldPolicy,
    listenerErrorPolicy: options.listenerErrorPolicy,
    onListenerError: options.onListenerError,
  });

  // Wrap with wizard controller
  const controller = new QuestionnaireController(form, steps);

  // Mount the <mlf-questionnaire> WC
  const host = document.createElement(
    questionnaireTagNames.questionnaire,
  ) as QuestionnaireRootElement;
  host.controller = controller;
  host.registry = primitiveRegistry;
  host.text = resolveQuestionnaireText(options.text);
  host.primitiveText = resolvePrimitiveText(options.primitiveText);
  container.replaceChildren(host);

  // Attach design system
  const designSystem = attachDesignSystem(host, {
    config: initialDesignSystem,
    registry: designSystemRegistry,
    onChange: options.onDesignSystemChange,
  });

  let unmounted = false;

  const mounted: MountedQuestionnaire = Object.freeze({
    controller,
    form,
    host,
    designSystem,
    unmount() {
      if (unmounted) return;
      unmounted = true;

      if (hostContainer[mountedRef] === mounted) {
        delete hostContainer[mountedRef];
      }

      form.abortSubmit("unmount");
      designSystem.disconnect();
      host.remove();
    },
  });

  hostContainer[mountedRef] = mounted;

  return mounted;
};

export const unmountQuestionnaire = (mounted: MountedQuestionnaire): void => {
  mounted.unmount();
};
