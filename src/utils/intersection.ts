import { Point } from ".";
// returns true if the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
export const intersects = (a1: Point, a2: Point, b1: Point, b2: Point) => {
  const a = a1.x;
  const b = a1.y;
  const c = a2.x;
  const d = a2.y;
  const p = b1.x;
  const q = b1.y;
  const r = b2.x;
  const s = b2.y;

  var det, gamma, lambda;
  det = (c - a) * (s - q) - (r - p) * (d - b);
  if (det === 0) {
    return false;
  } else {
    lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
    gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
    return 0 < lambda && lambda < 1 && 0 < gamma && gamma < 1;
  }
};
