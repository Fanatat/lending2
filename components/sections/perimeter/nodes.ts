export interface NetNode {
  id: string;
  label: string;
  x: number;
  y: number;
  vulnerable?: boolean;
  /**
   * "bottom" (default) puts the label under the dot. "right" puts it beside
   * the dot instead — needed for perimeter/router, which sit on one vertical
   * line (x: 50): a label sitting directly under either of them would be
   * drawn right on top of the edge continuing down to the next node.
   */
  labelSide?: "right";
}

// A real external attacker hits the router first, not the server — the
// server is just one of four equal-footing devices sitting behind it,
// same as the two PCs and the laptop. The one genuine internal finding
// (the leaking shared folder) still specifically implicates the server,
// so it keeps its own `vulnerable` marker independent of the attack path.
export const NODES: NetNode[] = [
  { id: "perimeter", label: "Внешний периметр", x: 50, y: 8, labelSide: "right" },
  { id: "router", label: "Роутер", x: 50, y: 32, labelSide: "right" },
  { id: "server", label: "Сервер", x: 10, y: 80, vulnerable: true },
  { id: "pc1", label: "ПК 1", x: 37, y: 90 },
  { id: "pc2", label: "Неттоп", x: 63, y: 90 },
  { id: "laptop", label: "Ноутбук", x: 90, y: 80 },
];

export const EDGES: [string, string][] = [
  ["perimeter", "router"],
  ["router", "server"],
  ["router", "pc1"],
  ["router", "pc2"],
  ["router", "laptop"],
];

/** Edge carrying the attack: external perimeter hits the router first. */
export const COMPROMISED_EDGE: [string, string] = ["perimeter", "router"];
