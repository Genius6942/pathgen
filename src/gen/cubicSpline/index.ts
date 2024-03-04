import type { PathPoint } from "$utils/pathPoint";
import { GeneratedPoint, Point } from "$utils";
import { BezierSpline } from "./core";

export const cubicSpline = (path: PathPoint[]): GeneratedPoint[] => {
  if (path.length < 2) return [];

  const first = [
    new Point().set(path[0]),
    new Point().set(path[0].handles[0].add(path[0])),
  ];
  const lastPoint = path[path.length - 1];
  const last = [
    new Point().set(lastPoint.handles[0].add(lastPoint)),
    new Point().set(lastPoint),
  ];
  const between = path
    .slice(1, path.length - 1)
    .map((point) => [
      new Point().set(point.handles[0].add(point)),
      new Point().set(point),
      new Point().set(point.handles[1].add(point)),
    ])
    .flat();

  const generator = new BezierSpline([...first, ...between, ...last]);

  const res = generator.generateSpline(1, 24, 12);

  return res.map(([point, speed]) => new GeneratedPoint(point.x, point.y, speed));
};
