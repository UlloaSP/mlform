// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import type { FieldDescriptor, PresentationRegistry, ReportDescriptor } from "@/presentation";
import type { ExplanationController, FormController, ReportController } from "@/runtime";
import {
  resolveExplanationDescriptor,
  resolveFieldDescriptor,
  resolveReportDescriptor,
} from "../presentation";

export type PresentedField = {
  controller: NonNullable<ReturnType<FormController["getField"]>>;
  descriptor: FieldDescriptor;
};

export type PresentedReport = {
  controller: ReportController;
  descriptor: ReportDescriptor | null;
};

export type PresentedExplanation = {
  controller: ExplanationController;
  descriptor: import("@/presentation").ExplanationDescriptor | null;
};

export const presentVisibleFields = (
  form: FormController,
  fieldIds: readonly string[],
  presentationRegistry: PresentationRegistry | undefined,
): PresentedField[] =>
  fieldIds
    .map((fieldId) => form.getField(fieldId))
    .filter((field): field is NonNullable<typeof field> => field !== undefined)
    .map((controller) => ({
      controller,
      descriptor: resolveFieldDescriptor(controller, presentationRegistry),
    }));

export const presentVisibleReports = (
  form: FormController,
  reportIds: readonly string[],
  reportPane: "auto" | "always" | "hidden",
  presentationRegistry: PresentationRegistry | undefined,
): PresentedReport[] => {
  const reports =
    reportPane === "always"
      ? form.reports
      : reportIds
          .map((reportId) => form.getReport(reportId))
          .filter((report): report is NonNullable<typeof report> => report !== undefined);

  return reports
    .map((controller) => ({
      controller,
      descriptor: resolveReportDescriptor(controller, form, presentationRegistry),
    }))
    .filter((report) => report.descriptor !== null);
};

export const presentExplanations = (
  form: FormController,
  explanationIds: readonly string[],
  presentationRegistry: PresentationRegistry | undefined,
): PresentedExplanation[] =>
  explanationIds
    .map((id) => form.getExplanation(id))
    .filter((e): e is ExplanationController => e !== undefined)
    .map((controller) => ({
      controller,
      descriptor: resolveExplanationDescriptor(controller, presentationRegistry),
    }));
