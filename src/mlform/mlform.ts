import type { IMLForm } from "./mlform.types";
import type { Schema } from "@/core";
import { FieldStrategy, ReportStrategy } from "@/extensions/app";
import { DescriptorService } from "@/core";

export class MLForm implements IMLForm {
  private readonly backendUrl: string;
  private readonly fieldService: DescriptorService;
  private readonly modelService: DescriptorService;

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

  public async toHTMLElement(
    data: Schema,
    container: HTMLElement
  ): Promise<HTMLElement> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    const parsedInput = this.fieldService.reg.schema.parse(data.input);
    await this.fieldService.mount(parsedInput, container);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    container.firstChild!.modelService = this.modelService;
    return container;
  }
}
