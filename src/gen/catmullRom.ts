import { Point } from "../utils";
import { GeneratedPoint, findDerivative, findPoint } from "./utils";

export const catmullRom = (path: Point[]) => {
  // initial setup here

  const first = path[0];
  const second = path[1];
  const last = path[path.length - 1];
  const firstGhostPoint = first.multiply(2).subtract(second);
  path.unshift(firstGhostPoint);
  path.push(last);

  const newPath: GeneratedPoint[] = [];
  const lastPoint = new GeneratedPoint(path[path.length - 2].x, path[path.length - 2].y);
  for (let j = 0; j < path.length - 3; j++) {
    const dist = Point.distance(path[j + 1], path[j + 2]);
    const nu = Math.floor(dist / 1);
    for (let i = 0; i < nu; i++) {
      const t = i / nu;
      const addPoint = findPoint(path[j], path[j + 1], path[j + 2], path[j + 3], t);

      let sped = findDerivative(path[j], path[j + 1], path[j + 2], path[j + 3], t) / dist;

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
