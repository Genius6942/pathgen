import type { Point } from "../utils";
import { catmullRom } from "./catmullRom";
import type { GeneratedPoint } from "./utils";

export * from "./catmullRom";
export * from "./utils";



export type PathAlgorithm = "catmull-rom";
export const pathAlgorithms: {
  [key in PathAlgorithm]: (path: Point[]) => GeneratedPoint[];
} = {
  "catmull-rom": catmullRom,
};
