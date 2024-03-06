import type { PathPoint } from "$utils/pathPoint";
import { GeneratedPoint, Point } from "$utils";
import { BezierSpline } from "./core";

const inner_cubicSpline = (path: Point[]): GeneratedPoint[] => {
  if (path.length < 2) return [];

  const generator = new BezierSpline(path);

  const res = generator.generateSpline(1, 24, 12);

  return res.map(
    ([point, speed]) => new GeneratedPoint(point.x, point.y, speed)
  );
};

export const cubicSpline = (path: PathPoint[]): GeneratedPoint[] => {
  if (path.length < 2) {
    return [];
  }

  const paths: Point[][] = [];
  let reverse = !path[0].reverse;
  paths.push([
    Point.from(path[0]),
    Point.from(path[0].handles[0].add(path[0])),
  ]);

  path.slice(1, path.length - 1).forEach((point) => {
    paths
      .at(-1)!
      .push(Point.from(point.handles[0].add(point)), Point.from(point));
    if (point.reverse) {
      paths.push([Point.from(point), Point.from(point.handles[1].add(point))]);
    } else {
      paths.at(-1)!.push(Point.from(point.handles[1].add(point)));
    }
  });

  paths
    .at(-1)
    ?.push(
      Point.from(path.at(-1)!.handles[0].add(path.at(-1)!)),
      Point.from(path.at(-1)!)
    );

  console.log(paths);
  const generatedPaths = paths
    // generation
    .map((p) => inner_cubicSpline(p))
    // apply reversing to speeds
    .map((gen) => {
      reverse = !reverse;

      return reverse
        ? gen.map((point) => {
            point.speed *= -1;
            return point;
          })
        : gen;
    })
    // remove duplicate points
    .map((gen, i) => (i === 0 ? gen : gen.slice(1)));

  return generatedPaths.flat();
};
