import { Point } from "../utils";
import { findDerivative, findPoint } from "./utils";

export const catmullRom = (path: Point[]) => {
  const newPath: Point[] = [];
  const lastPoint = path[path.length - 2];
  for (let j = 0; j < path.length - 3; j++) {
    const dist = Point.distance(path[j + 1], path[j + 2]);
    const nu = Math.floor(dist / 2.5);
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
      if (i === 0) {
        addPoint.data = { marker: true };
      }
      newPath.push(addPoint);
    }
  }

  lastPoint.speed = 0;
  lastPoint.data = { marker: true };
  newPath.push(lastPoint);

  return newPath;
};
