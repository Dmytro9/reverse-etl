import type { ReactNode } from "react";
import type { UseWizardReturn } from "../hooks/useWizard";

export const STEP_LABELS = {
  SOURCE: "Source",
  TABLE: "Table",
  MAPPING: "Mapping",
  PREVIEW: "Preview",
} as const;

export type StepLabel = (typeof STEP_LABELS)[keyof typeof STEP_LABELS];

export type StepConfig = {
  label: StepLabel;
  render: (wizard: UseWizardReturn) => ReactNode | null;
};

export const PREVIEW_LIMITS = [1, 5, 10, 25] as const;
export const DEFAULT_PREVIEW_LIMIT = 5;
export const SEND_SUCCESS_TIMEOUT = 4000;
export const COPY_SUCCESS_TIMEOUT = 2000;
export const FAKE_SEND_DELAY = 1500;

export type SendStatus = "idle" | "success" | "error";
