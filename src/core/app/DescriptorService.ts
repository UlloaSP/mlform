import type { Base, Output } from "@/core/domain";
import type { DescriptorItem } from "./DescriptorItem";
import { DescriptorRegistry } from "./DescriptorRegistry";

const UNSUPPORTED_TYPE_ERROR = "[DescriptorService] Unsupported <<type>>";

export class DescriptorService {
  protected readonly registry: DescriptorRegistry = new DescriptorRegistry();
  protected declare backendUrl: string;
  private readonly loadedTypes = new Set<string>();

  constructor(backendUrl: string = "") {
    this.backendUrl = backendUrl;
  }

  get reg(): DescriptorRegistry {
    return this.registry;
  }

  public async mount(data: Base, host: HTMLElement): Promise<void> {
    await this.ensureComponents(data); // 1⃣ componentes listos
    const descriptors = this.renderDescriptors(data); // 2⃣ datos validados
    host.innerHTML = this.descriptorsToInnerHtml(descriptors); // 3⃣ render
  }

  protected async ensureComponents(data: Base): Promise<void> {
    const pending: Promise<unknown>[] = [
      import("@/core/ui/ml-layout"),
      import("@/core/ui/field-wrapper"),
    ];

    // 2. Componentes específicos declarados por cada Strategy
    for (const payload of data) {
      const type = payload.type;
      const strat = this.reg.get(type);
      if (!strat) {
        throw new Error(UNSUPPORTED_TYPE_ERROR.replace("type", type));
      }
      if (!this.loadedTypes.has(type)) {
        this.loadedTypes.add(type);
        pending.push(strat.loader());
      }
    }

    await Promise.all(pending);
  }

  protected renderDescriptors(data: Base): DescriptorItem[] {
    this.reg.schema.parse(data);
    const descriptors: DescriptorItem[] = [];

    for (const payload of data) {
      const type = payload.type;
      const strat = this.reg.get(type)!;
      const parsed = strat.parse(payload as unknown as typeof strat.schema);
      descriptors.push(
        strat.buildDescriptor(parsed as unknown as typeof payload)
      );
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

  public async render(data: Output): Promise<void> {
    const parsed: unknown = this.reg.schema.parse(data.outputs);

    // 1⃣  Lazy-load de los Web Components implicados
    // @ts-ignore
    await this.ensureComponents(parsed);

    // 2⃣  Construcción de DescriptorItem
    // @ts-ignore
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
