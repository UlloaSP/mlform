// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  AttachedDesignSystem,
  DesignSystemConfig,
  DesignSystemRegistry,
  ResolvedDesignSystem,
} from "@/design";
import type { FormController, Registry } from "@/runtime";
import type {
  PrimitiveContainerStrategy,
  PrimitiveRegistry,
  PrimitiveReportTransport,
  PrimitiveTextOverrides,
} from "@/primitives";
import type { PrimitiveDescriptorRegistry } from "@/primitives";
import type { CreateFormViewOptions, FormViewController } from "@/view";
import type { WizardLabels } from "./wizard/labels";

export interface KitDesignSystemSnapshot extends Omit<
  DesignSystemConfig,
  "mode" | "theme" | "recipe"
> {
  mode: NonNullable<DesignSystemConfig["mode"]>;
  theme: NonNullable<DesignSystemConfig["theme"]>;
  recipe: NonNullable<DesignSystemConfig["recipe"]>;
}

export interface KitLabels extends WizardLabels {
  form?: string;
  reports?: string;
  tabs?: string;
  sectionsOpen?: (count: number) => string;
  stepLabel?: (current: number, total: number) => string;
}

export interface MountFormOptions extends CreateFormViewOptions {
  primitiveRegistry?: PrimitiveRegistry;
  designSystemRegistry?: DesignSystemRegistry;
  designSystem?: DesignSystemConfig;
  containerStrategy?: PrimitiveContainerStrategy;
  reportPane?: "auto" | "always" | "hidden";
  reportTransport?: PrimitiveReportTransport;
  labels?: KitLabels;
  primitiveText?: PrimitiveTextOverrides;
  onDesignSystemChange?: (resolved: ResolvedDesignSystem) => void;
  hostLifecycle?: "manual" | "document";
}

export interface MountedForm {
  readonly form: FormController;
  readonly host: HTMLElement;
  readonly engineRegistry: Registry;
  readonly descriptorRegistry: PrimitiveDescriptorRegistry;
  readonly primitiveRegistry: PrimitiveRegistry;
  readonly designSystemRegistry: DesignSystemRegistry;
  readonly designSystem: AttachedDesignSystem;
  submit: FormViewController["submit"];
  updateDesignSystem(config: DesignSystemConfig): void;
  replaceDesignSystem(config: KitDesignSystemSnapshot): void;
  resetDesignSystem(): void;
  suspend(reason?: string): void;
  resume(): void;
  unmount(): void;
}
