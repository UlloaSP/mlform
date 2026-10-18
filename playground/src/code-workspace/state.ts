import { STARTER_CODE } from "./example.ts";
import { getCodeExample } from "./examples.ts";

export type CodePosition = "left" | "right" | "top" | "bottom";
export interface CodeWorkspaceState {
  code: string;
  position: CodePosition;
  ratio: number;
  exampleId: string;
}

const STORAGE_KEY = "mlform-code-workspace";
export const isCodePosition = (value: unknown): value is CodePosition =>
  value === "left" || value === "right" || value === "top" || value === "bottom";

export const readWorkspaceState = (width: number): CodeWorkspaceState => {
  const fallback: CodeWorkspaceState = {
    code: STARTER_CODE,
    position: width < 720 ? "top" : "left",
    ratio: 50,
    exampleId: "basic",
  };
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (!saved || typeof saved !== "object") return fallback;
    return {
      exampleId: getCodeExample("exampleId" in saved ? saved.exampleId : undefined).id,
      code: "code" in saved && typeof saved.code === "string" ? saved.code : fallback.code,
      position:
        "position" in saved && isCodePosition(saved.position) ? saved.position : fallback.position,
      ratio:
        "ratio" in saved && typeof saved.ratio === "number" && Number.isFinite(saved.ratio)
          ? Math.max(20, Math.min(80, saved.ratio))
          : 50,
    };
  } catch {
    return fallback;
  }
};

export const saveWorkspaceState = (state: CodeWorkspaceState): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
};
