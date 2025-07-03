import type { Schema } from "@/core/domain";
import type { DescriptorItem } from "./DescriptorItem";
import { DescriptorRegistry } from "./DescriptorRegistry";

export class DescriptorService {
  protected readonly registry: DescriptorRegistry = new DescriptorRegistry();
  declare protected backendUrl: string;
  private readonly loadedTypes = new Set<string>();

  constructor(backendUrl: string = "") {
    this.backendUrl = backendUrl;
  }

  get reg(): DescriptorRegistry {
    return this.registry;
  }

  public async mount(data: unknown[], host: HTMLElement): Promise<void> {
    await this.ensureComponents(data); // 1⃣ componentes listos
    const descriptors = this.renderDescriptors(data); // 2⃣ datos validados
    host.innerHTML = this.descriptorsToInnerHtml(descriptors); // 3⃣ render
  }

  protected async ensureComponents(data: unknown[]): Promise<void> {
    const pending: Promise<unknown>[] = [
      import("@/core/ui/ml-layout"),
      import("@/core/ui/field-wrapper"),
    ];

    // 2. Componentes específicos declarados por cada Strategy
    for (const payload of data) {
      const type = (payload as { type: string }).type;
      const strat = this.reg.get(type);
      if (!strat) {
        throw new Error(`[DescriptorService] Tipo no soportado: ${type}`);
      }
      if (!this.loadedTypes.has(type)) {
        this.loadedTypes.add(type);
        pending.push(strat.loader());
      }
    }

    await Promise.all(pending);
  }

  protected renderDescriptors(data: unknown[]): DescriptorItem[] {
    this.reg.schema.parse(data);
    const descriptors: DescriptorItem[] = [];

    for (const payload of data) {
      const type = (payload as { type: string }).type;
      const strat = this.reg.get(type)!;
      const parsed = strat.parse(payload as Schema);
      descriptors.push(strat.buildDescriptor(parsed));
    }
    return descriptors;
  }

  protected descriptorsToInnerHtml(list: DescriptorItem[]): string {
    const inputs = list
      .filter((d) => d.slot === "inputs")
      .map((d) => this.renderDescriptor(d))
      .join("");

    return `<ml-layout backendUrl="${this.backendUrl}">
  <div slot="inputs">${inputs}</div>
  <div slot="report"></div>
</ml-layout>`;
  }

  protected reportDescriptorsToInnerHtml(
    descriptors: DescriptorItem[]
  ): string {
    return descriptors
      .filter((d) => d.slot === "report")
      .map((d) => this.renderDescriptor(d))
      .join("");
  }

  public async render(data: Schema): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore – el DTO raíz expone .output: unknown[]
    const parsed = this.reg.schema.parse(data.output);

    // 1⃣  Lazy-load de los Web Components implicados
    await this.ensureComponents(parsed);

    // 2⃣  Construcción de DescriptorItem
    const descriptors = this.renderDescriptors(parsed);

    // 3⃣  Inyección en el slot del layout maestro
    const reportSlot =
      document.querySelector<HTMLDivElement>('div[slot="report"]');
    if (reportSlot) {
      reportSlot.innerHTML = this.reportDescriptorsToInnerHtml(descriptors);
    }
  }

  private renderDescriptor(d: DescriptorItem): string {
    const attrs = this.propsToAttrs(d.props);
    return d.child
      ? `<${d.tag} ${attrs}>${this.renderDescriptor(d.child)}</${d.tag}>`
      : `<${d.tag} ${attrs}></${d.tag}>`;
  }

  /** Serializa el objeto `props` a atributos HTML. */
  private propsToAttrs(props: Record<string, unknown>): string {
    return Object.entries(props)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) =>
        typeof v === "boolean" && v ? `${k}=""` : `${k}="${String(v)}"`
      )
      .join(" ");
  }
}
