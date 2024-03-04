import { GeneratedPoint, PathPoint, Point } from "$utils";

function deCasteljau(path: Point[], t: number): Point[] {
  if (path.length === 1) {
    return path;
  }

  const newPath: Point[] = [];

  for (let i = 0; i < path.length - 1; i++) {
    const nextPoint = Point.lerp(path[i], path[i + 1], t);
    newPath.push(nextPoint);
  }

  return deCasteljau(newPath, t);
}

function injection(path: Point[], numPoints: number): Point[] {
  const newPath: Point[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const addPoint = deCasteljau(path, t)[0];
    (addPoint as any).index = i;
    newPath.push(addPoint);
  }

  return newPath;
}

function findPoint(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): Point {
  const c0 = p1;
  const c1 = { x: p0.x * -0.5 + p2.x * 0.5, y: p0.y * -0.5 + p2.y * 0.5 };
  const c2 = {
    x: p0.x * 1 + p1.x * (0.5 - 3) + p2.x * (3 - 2 * 0.5) + p3.x * -0.5,
    y: p0.y * 1 + p1.y * (0.5 - 3) + p2.y * (3 - 2 * 0.5) + p3.y * -0.5,
  };
  const c3 = {
    x: p0.x * -0.5 + p1.x * (2 - 0.5) + p2.x * (0.5 - 2) + p3.x * 0.5,
    y: p0.y * -0.5 + p1.y * (2 - 0.5) + p2.y * (0.5 - 2) + p3.y * 0.5,
  };

  const t2 = t * t;
  const t3 = t2 * t;

  const newPoint = Point.from({
    x: c0.x + c1.x * t + c2.x * t2 + c3.x * t3,
    y: c0.y + c1.y * t + c2.y * t2 + c3.y * t3,
  });
  return newPoint;
}

function findDerivative(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): number {
  const c1 = { x: p0.x * -0.5 + p2.x * 0.5, y: p0.y * -0.5 + p2.y * 0.5 };
  const c2 = {
    x: p0.x * 1 + p1.x * (0.5 - 3) + p2.x * (3 - 2 * 0.5) + p3.x * -0.5,
    y: p0.y * 1 + p1.y * (0.5 - 3) + p2.y * (3 - 2 * 0.5) + p3.y * -0.5,
  };
  const c3 = {
    x: p0.x * -0.5 + p1.x * (2 - 0.5) + p2.x * (0.5 - 2) + p3.x * 0.5,
    y: p0.y * -0.5 + p1.y * (2 - 0.5) + p2.y * (0.5 - 2) + p3.y * 0.5,
  };

  const t2 = t * t;

  const C1 = c1;
  const C2 = { x: c2.x * (2 * t), y: c2.y * (2 * t) };
  const C3 = { x: c3.x * (3 * t2), y: c3.y * (3 * t2) };
  const newD = { x: C1.x + C2.x + C3.x, y: C1.y + C2.y + C3.y };

  return Math.sqrt(newD.x * newD.x + newD.y * newD.y);
}

function catmullRom(path: Point[]): Point[] {
  const newPath: Point[] = [];
  const lastPoint = path[path.length - 2];
  for (let j = 0; j < path.length - 3; j++) {
    const dist = Point.distance(path[j + 1], path[j + 2]);
    const nu = Math.floor(dist / 2.5);
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
      (addPoint as any).speed = sped;

      (addPoint as any).index = i;
      newPath.push(addPoint);
    }
  }

  (lastPoint as any).speed = 0;
  newPath.push(lastPoint);

  return newPath;
}

function generateCumulativeDistance(path: Point[]): number[] {
  let d = 0;
  const cumDistance: number[] = [0];

  for (let i = 0; i < path.length - 1; i++) {
    const pointToPointDistance = Point.distance(path[i], path[i + 1]);
    d += pointToPointDistance;
    cumDistance.push(d);
  }

  return cumDistance;
}

function cubicSpline(path: Point[], numPoints: number): Point[] {
  const sectionedSpline: Point[][] = [];

  for (let i = 0; i < path.length - 1; i += 3) {
    const curve = [path[i], path[i + 1], path[i + 2], path[i + 3]];
    const injectedCurve = injection(curve, numPoints);
    sectionedSpline.push(injectedCurve);
  }

  const newPath: Point[] = [];
  for (let i = 0; i < sectionedSpline.length * numPoints; i++) {
    const t = i / numPoints;
    const u = Math.floor(t);
    const tPrime = t - u;
    const addPoint = deCasteljau(sectionedSpline[u], tPrime)[0];
    (addPoint as any).index = i;
    newPath.push(addPoint);
  }

  const lastPoint = path[path.length - 1];
  (lastPoint as any).index = sectionedSpline.length * numPoints;
  newPath.push(lastPoint);

  return newPath;
}

export function cubicSpline2(
  path: Point[],
  distance: number,
  approx: number
): Point[] {
  const numPoints = Math.floor(approx);
  const sectionedSpline: Point[][] = [];

  for (let i = 0; i < path.length - 1; i += 3) {
    const curve = [path[i], path[i + 1], path[i + 2], path[i + 3]];
    const injectedCurve = injection(curve, numPoints);
    sectionedSpline.push(injectedCurve);
  }

  const sampleSpline = cubicSpline(path, numPoints);
  const cumDistance = generateCumulativeDistance(sampleSpline);
  const curveLength = cumDistance[cumDistance.length - 1];
  const totalPoints = Math.floor(curveLength / distance);
  distance = curveLength / totalPoints;
  const newPath: Point[] = [];
  let dCounter = 0;

  for (let i = 0; i < totalPoints; i++) {
    const dValue = i * distance;
    for (let j = dCounter; j < totalPoints; j++) {
      if (cumDistance[j] <= dValue && dValue <= cumDistance[j + 1]) {
        const slope = (cumDistance[j + 1] - cumDistance[j]) * approx;
        const t = (dValue - cumDistance[j]) / slope + j / approx;
        const u = Math.floor(t);
        const tPrime = t - u;
        const addPoint = deCasteljau(sectionedSpline[u], tPrime)[0];
        (addPoint as any).index = i;
        newPath.push(addPoint);
        dCounter = j;
        break;
      }
    }
  }

  const lastPoint = path[path.length - 1];
  (lastPoint as any).index = sectionedSpline.length * numPoints;
  newPath.push(lastPoint);

  return newPath;
}

const cubicSplineWrapper = (path: PathPoint[]) => {
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

  return cubicSpline2([...first, ...between, ...last], 1, 30).map((p) => new GeneratedPoint(p.x, p.y));
};

export { cubicSplineWrapper as cubicSpline };
