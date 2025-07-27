import type { Schema } from "@/core";
import { DescriptorService } from "@/core";
import { FieldStrategy, ReportStrategy } from "@/extensions/app";
import type { IMLForm } from "./mlform.types";

type SubmitCallback = (data: Record<string, string>) => void;

export class MLForm implements IMLForm {
  private readonly backendUrl: string;
  private readonly fieldService: DescriptorService;
  private readonly modelService: DescriptorService;
  private _lastInputs: Record<string, string> | null = null;
  private readonly _listeners = new Set<SubmitCallback>();

  constructor(backendUrl: string) {
    this.backendUrl = backendUrl;
    this.fieldService = new DescriptorService(this.backendUrl);
    this.modelService = new DescriptorService();
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
  public get lastInputs(): Record<string, string> | null {
    return this._lastInputs;
  }

  /** Suscripción reactiva; devuelve la función para des‑suscribirse */
  public onSubmit(cb: SubmitCallback): () => void {
    this._listeners.add(cb);
    return () => this._listeners.delete(cb);
  }

  public async toHTMLElement(
    data: Schema,
    container: HTMLElement
  ): Promise<HTMLElement> {
    const parsedInput = this.fieldService.reg.schema.parse(data.input);
    await this.fieldService.mount(parsedInput, container);
    container.firstChild!.modelService = this.modelService;

    container.firstChild!.addEventListener(
      "mlform-submit",
      (ev: Event) => {
        const { inputs } = (
          ev as CustomEvent<{
            inputs: Record<string, string>;
            response: unknown;
          }>
        ).detail;
        this._lastInputs = inputs;
        this._listeners.forEach((cb) => cb(inputs));
      },
      { passive: true }
    );

    return container;
  }

  public async validateSchema(data: Schema): Promise<unknown> {
    return this.fieldService.reg.schema.safeParseAsync(data.input);
  }
}
