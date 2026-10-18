import type { DesignSystemConfig } from "mlform/design";
import type { FormController } from "mlform/runtime";
import type { captureDemoState } from "./demo-state.ts";
import type { CodeWorkspaceState } from "./code-workspace/state.ts";

interface FormulationPresentationState {
  materials: string[][];
  example: string;
}

export type PresentationState = FormulationPresentationState | CodeWorkspaceState;

export interface DemoHandle {
  readonly form?: FormController;
  readonly forms?: FormController[];
  capturePresentationState?(): PresentationState | undefined;
  restorePresentationState?(state: PresentationState | undefined): void;
  updateDesignSystem(config: DesignSystemConfig): void;
  unmount(): void;
}

export interface Demo {
  id: string;
  label: string;
  group: "Examples" | "Layouts" | "Debug" | "Code";
  mount(container: HTMLElement, designSystem: DesignSystemConfig): DemoHandle;
}

export type DemoState = ReturnType<typeof captureDemoState>;

declare global {
  interface Window {
    mlformPreview?: {
      captureState(): DemoState;
      restoreState(state: DemoState | null | undefined): Promise<void>;
      unmount(): void;
    };
  }
}
