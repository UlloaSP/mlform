import type { Schema } from "@/core";
import type { FieldStrategy, ReportStrategy } from "@/extensions/app";

export interface IMLForm {
  register(descriptor: FieldStrategy): void;
  register(descriptor: ReportStrategy): void;

  update(descriptor: FieldStrategy): void;
  update(descriptor: ReportStrategy): void;

  unregister(descriptor: FieldStrategy): void;
  unregister(descriptor: ReportStrategy): void;

  toHTMLElement(data: Schema, container: HTMLElement): Promise<HTMLElement>;
}
