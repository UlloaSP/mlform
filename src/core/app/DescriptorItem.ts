export interface DescriptorItem {
  tag: string;
  props: Record<string, unknown>;
  child?: DescriptorItem;
  slot: "inputs" | "report" | "layout";
}
