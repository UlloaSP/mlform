// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type {
  AttachedDesignSystem,
  DesignSystemConfig,
  DesignSystemRegistry,
  ResolvedDesignSystem,
} from "@/design-system";
import type { PrimitiveRegistry, PrimitiveTextOverrides } from "@/primitives";
import type { KitLabels } from "./mount-types";
import type { FormViewController } from "./view-core-types";
import type { WizardLabels, WizardTextOverrides } from "./wizard-constants";

export type {
  AccordionState,
  CreateFormViewOptions,
  FormViewController,
  FormViewFieldItem,
  FormViewReportItem,
  FormViewSnapshot,
  FormViewState,
  LayoutReferences,
  PanelState,
  TabsState,
  WizardState,
} from "./view-core-types";

export interface WizardMountUiOptions {
  labels?: WizardLabels;
  text?: WizardTextOverrides;
  primitiveRegistry?: PrimitiveRegistry;
  primitiveText?: PrimitiveTextOverrides;
  designSystem?: DesignSystemConfig;
  designSystemRegistry?: DesignSystemRegistry;
  onDesignSystemChange?: (resolved: ResolvedDesignSystem) => void;
}

export type MountWizardFormOptions =
  | ({ view: FormViewController } & WizardMountUiOptions)
  | (import("./view-core-types").CreateFormViewOptions &
      WizardMountUiOptions & { layout: import("./layout-types").WizardLayoutConfig });

export interface MountedWizardForm {
  readonly view: FormViewController;
  readonly form: import("@/runtime").FormController;
  readonly host: HTMLElement;
  readonly designSystem: AttachedDesignSystem;
  unmount(): void;
}

export interface TabsMountUiOptions {
  labels?: KitLabels;
  primitiveRegistry?: PrimitiveRegistry;
  primitiveText?: PrimitiveTextOverrides;
  designSystem?: DesignSystemConfig;
  designSystemRegistry?: DesignSystemRegistry;
  onDesignSystemChange?: (resolved: ResolvedDesignSystem) => void;
}

export type MountTabsFormOptions =
  | ({ view: FormViewController } & TabsMountUiOptions)
  | (import("./view-core-types").CreateFormViewOptions &
      TabsMountUiOptions & { layout: import("./layout-types").TabsLayoutConfig });

export interface MountedTabsForm {
  readonly view: FormViewController;
  readonly form: import("@/runtime").FormController;
  readonly host: HTMLElement;
  readonly designSystem: AttachedDesignSystem;
  unmount(): void;
}

export interface AccordionMountUiOptions {
  labels?: KitLabels;
  primitiveRegistry?: PrimitiveRegistry;
  primitiveText?: PrimitiveTextOverrides;
  designSystem?: DesignSystemConfig;
  designSystemRegistry?: DesignSystemRegistry;
  onDesignSystemChange?: (resolved: ResolvedDesignSystem) => void;
}

export type MountAccordionFormOptions =
  | ({ view: FormViewController } & AccordionMountUiOptions)
  | (import("./view-core-types").CreateFormViewOptions &
      AccordionMountUiOptions & { layout: import("./layout-types").AccordionLayoutConfig });

export interface MountedAccordionForm {
  readonly view: FormViewController;
  readonly form: import("@/runtime").FormController;
  readonly host: HTMLElement;
  readonly designSystem: AttachedDesignSystem;
  unmount(): void;
}
