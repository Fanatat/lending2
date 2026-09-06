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

// A real external attacker hits the router first, then pivots straight to
// the server — the one genuine internal finding (the leaking shared
// folder) specifically implicates the server, so the attack path is drawn
// all the way to it instead of stopping at the router. The other three
// devices behind the router (the two PCs and the laptop) sit on equal
// footing but aren't part of this particular finding.
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

/**
 * Edges carrying the attack, in order: external perimeter hits the router
 * first, then pivots on to the server.
 */
export const COMPROMISED_EDGES: [string, string][] = [
  ["perimeter", "router"],
  ["router", "server"],
];
