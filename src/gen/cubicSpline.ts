import type { PathPoint } from "$utils/pathPoint";
import { GeneratedPoint } from "./utils";

export const cubicSpline = (path: PathPoint[]): GeneratedPoint[] => {
  // filler code, add function later
  return path.map((point) => new GeneratedPoint(point.x, point.y));
};
