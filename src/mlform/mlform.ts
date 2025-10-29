// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Pablo Ulloa Santin

import * as z from "zod";
import type { Signature } from "@/core";
import { DescriptorService } from "@/core";
import type { Base, Output } from "@/core/domain";
import { FieldStrategy, ReportStrategy } from "@/extensions/app";
import type { IMLForm } from "./mlform.types";

type SubmitCallback = (
  inputs: Record<string, unknown>,
  response: Output
) => void;

export class MLForm implements IMLForm {
  private readonly backendUrl: string;
  private readonly fieldService: DescriptorService;
  private readonly modelService: DescriptorService;
  private _lastInputs: Record<string, unknown> | null = null;
  private _lastResponse: Output | null = null;
  private readonly _listeners = new Set<SubmitCallback>();

  constructor(backendUrl: string) {
    this.backendUrl = backendUrl;
    this.fieldService = new DescriptorService();
    this.modelService = new DescriptorService(this.backendUrl);
  }

  public register(descriptor: FieldStrategy | ReportStrategy): void {
    if (descriptor instanceof FieldStrategy) {
      this.fieldService.reg.register(descriptor);
    } else {
      this.modelService.reg.register(descriptor);
    }
  }

  public update(descriptor: FieldStrategy | ReportStrategy): void {
    if (descriptor instanceof FieldStrategy) {
      this.fieldService.reg.update(descriptor);
    } else {
      this.modelService.reg.update(descriptor);
    }
  }

  public unregister(descriptor: FieldStrategy | ReportStrategy): void {
    if (descriptor instanceof FieldStrategy) {
      this.fieldService.reg.unregister(descriptor.type);
    } else {
      this.modelService.reg.unregister(descriptor.type);
    }
  }

  /** Lectura sincrónica del último envío */
  public get lastInputs(): Record<string, unknown> | null {
    return this._lastInputs;
  }

  public get lastResponse(): Output | null {
    return this._lastResponse;
  }

  /** Suscripción reactiva; devuelve la función para des‑suscribirse */
  public onSubmit(cb: SubmitCallback): () => void {
    this._listeners.add(cb);
    return () => this._listeners.delete(cb);
  }

  public async toHTMLElement(
    data: Signature,
    container: HTMLElement
  ): Promise<HTMLElement> {
    const parsedInput = this.fieldService.reg.schema.parse(data.inputs);
    this.modelService.tmpOutputs = data.outputs;
    await this.fieldService.mount(parsedInput as Base, container);

    const host = container.firstChild! as HTMLElement & {
      modelService?: DescriptorService;
      __mlSubmitHandler?: EventListener;
    };
    host.modelService = this.modelService;

    if (host.__mlSubmitHandler) {
      host.removeEventListener("ml-submit", host.__mlSubmitHandler);
    }

    host.__mlSubmitHandler = (ev: Event) => {
      const { inputs, response } = (
        ev as CustomEvent<{
          inputs: Record<string, unknown>;
          response: Output;
        }>
      ).detail;

      this._lastInputs = inputs;
      this._lastResponse = response;
      this._listeners.forEach((cb) => cb(inputs, response));
    };

    host.addEventListener("ml-submit", host.__mlSubmitHandler, {
      passive: true,
    });

    return container;
  }

  public async validateSchema(data: Signature): Promise<unknown> {
    return this.fieldService.reg.schema.safeParseAsync(data.inputs);
  }

  public schema() {
    return z.toJSONSchema(
      z.strictObject({
        inputs: this.fieldService.reg.schema,
        outputs: z.optional(this.modelService.reg.schema),
      }),
      { target: "draft-2020-12" }
    );
  }
}
