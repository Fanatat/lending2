export interface NetNode {
  id: string;
  label: string;
  x: number;
  y: number;
  vulnerable?: boolean;
}

export const NODES: NetNode[] = [
  { id: "perimeter", label: "Внешний периметр", x: 50, y: 8 },
  { id: "server", label: "Сервер", x: 50, y: 30, vulnerable: true },
  { id: "router", label: "Роутер", x: 50, y: 55 },
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
