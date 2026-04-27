// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  DeclarativeFieldKind,
  FieldConfig,
  FieldDefinition,
  FieldDescriptor,
  FieldRenderHints,
  FieldRenderSpecContext,
  FieldStateSnapshot,
} from "../types";

const declarativeFieldComponent = "declarative-field";

const resolveHints = <TConfig extends FieldConfig, TValue>(
  hints:
    | FieldRenderHints
    | ((context: FieldRenderSpecContext<TConfig, TValue>) => FieldRenderHints)
    | undefined,
  context: FieldRenderSpecContext<TConfig, TValue>,
): FieldRenderHints => {
  if (!hints) {
    return {};
  }

  return typeof hints === "function" ? (hints(context) ?? {}) : hints;
};

const createDescriptor = <TConfig extends FieldConfig, TValue>(
  config: TConfig & { id: string },
  state: FieldStateSnapshot,
  kind: DeclarativeFieldKind<TConfig, TValue>,
): FieldDescriptor => {
  const value = state.value as TValue;
  const hints = resolveHints(kind.render.hints, {
    config,
    fieldId: config.id,
    state,
    value,
  });

  return {
    component: declarativeFieldComponent,
    props: {
      id: config.id,
      kind: config.kind,
      label: config.label,
      description: config.description ?? "",
      required: Boolean(config.required),
      disabled: Boolean(config.disabled),
      widget: kind.render.widget,
      value,
      state: state.status,
      errors: state.errors,
      ...hints,
      ...config.ui,
    },
    meta: {
      declarative: true,
      widget: kind.render.widget,
    },
  };
};

export const defineFieldKind = <TConfig extends FieldConfig, TValue>(
  kind: DeclarativeFieldKind<TConfig, TValue>,
): FieldDefinition<TConfig, TValue> => {
  const validate = kind.validate;

  return {
    kind: kind.kind,
    schema: kind.schema,
    getDefaultValue: kind.value?.default,
    normalizeValue: kind.value?.normalize,
    cloneValue: kind.value?.clone,
    isEqual: kind.value?.isEqual,
    serializeValue: kind.value?.serialize,
    validate: validate
      ? (value, config, context) =>
          validate({
            ...context,
            config,
            value,
          })
      : undefined,
    describe: (config, context) =>
      createDescriptor(config as TConfig & { id: string }, context.state, kind),
  };
};
