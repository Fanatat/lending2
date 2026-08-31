export interface Silhouette {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Five vague shapes for the flashlight easter egg — "будущие проекты". */
export const SILHOUETTES: Silhouette[] = [
  { id: "s1", x: 18, y: 25, w: 60, h: 90 },
  { id: "s2", x: 72, y: 20, w: 50, h: 70 },
  { id: "s3", x: 45, y: 55, w: 70, h: 60 },
  { id: "s4", x: 12, y: 70, w: 45, h: 45 },
  { id: "s5", x: 85, y: 68, w: 40, h: 55 },
];
