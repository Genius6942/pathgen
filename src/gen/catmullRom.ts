import { PathPoint, Point } from "../utils";
import { GeneratedPoint, findDerivative, findPoint } from "./utils";

const raw_catmullRom = (path: Point[]) => {
  // initial setup here

  const first = path[0];
  const second = path[1];
  const last = path[path.length - 1];
  const firstGhostPoint = first.multiply(2).subtract(second);
  path.unshift(firstGhostPoint);
  path.push(last);

  const newPath: GeneratedPoint[] = [];
  const lastPoint = new GeneratedPoint(
    path[path.length - 2].x,
    path[path.length - 2].y
  );
  for (let j = 0; j < path.length - 3; j++) {
    const dist = Point.distance(path[j + 1], path[j + 2]);
    const nu = Math.floor(dist / 1);
    for (let i = 0; i < nu; i++) {
      const t = i / nu;
      const addPoint = findPoint(
        path[j],
        path[j + 1],
        path[j + 2],
        path[j + 3],
        t
      );

      let sped =
        findDerivative(path[j], path[j + 1], path[j + 2], path[j + 3], t) /
        dist;

      if (j == path.length - 4) {
        if (Point.distance(addPoint, lastPoint) < 5) {
          sped = (sped * Point.distance(addPoint, lastPoint)) / 5;
        }
      }
      addPoint.speed = sped;

      addPoint.index = i;
      newPath.push(addPoint);
    }
  }

  lastPoint.speed = 0;
  newPath.push(lastPoint);

  return newPath;
};

export const catmullRom = (path: PathPoint[]): GeneratedPoint[] => {
  if (path.length < 2) {
    return [];
  }


  const paths: Point[][] = [];
  let reverse = !path[0].reverse;
  paths.push([Point.from(path[0])]);

  path.slice(1, path.length - 1).forEach((point) => {
    paths.at(-1)?.push(Point.from(point));

    // console.log(point);
    if (point.reverse) {
      paths.push([Point.from(point)]);
    }
  });

  paths.at(-1)?.push(Point.from(path.at(-1)!));

  // console.log(paths);
  const generatedPaths = paths
    // generation
    .map((p) => raw_catmullRom(p))
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
