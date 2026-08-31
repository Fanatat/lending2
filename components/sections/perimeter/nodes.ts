export interface NetNode {
  id: string;
  label: string;
  x: number;
  y: number;
  vulnerable?: boolean;
  /**
   * "bottom" (default) puts the label under the dot. "right" puts it beside
   * the dot instead — needed for perimeter/server/router, which sit on one
   * vertical line (x: 50): a label sitting directly under any of them would
   * be drawn right on top of the edge continuing down to the next node.
   */
  labelSide?: "right";
}

export const NODES: NetNode[] = [
  { id: "perimeter", label: "Внешний периметр", x: 50, y: 8, labelSide: "right" },
  {
    id: "server",
    label: "Сервер",
    x: 50,
    y: 30,
    vulnerable: true,
    labelSide: "right",
  },
  { id: "router", label: "Роутер", x: 50, y: 55, labelSide: "right" },
  { id: "pc1", label: "ПК 1", x: 18, y: 82 },
  { id: "pc2", label: "ПК 2", x: 50, y: 90 },
  { id: "laptop", label: "Ноутбук", x: 82, y: 82 },
];

export const EDGES: [string, string][] = [
  ["perimeter", "server"],
  ["server", "router"],
  ["router", "pc1"],
  ["router", "pc2"],
  ["router", "laptop"],
];

/** Edge carrying the found vulnerability (see ▸ Подробнее — открытая папка на сервере). */
export const COMPROMISED_EDGE: [string, string] = ["perimeter", "server"];
