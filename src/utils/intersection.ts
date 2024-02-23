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

export const parseIntersections = (line1: Point[], line2: Point[]) => {
  line1 = line1.map((point) => point.clone());
  line2 = line2.map((point) => point.clone());

  let lastMarkerIndex = 0;
  let flagCurrent = false;
  for (let i = 0; i < line1.length - 1; i++) {
    const a1 = line1[i],
      a2 = line1[i + 1];

    if (a1.data.marker) {
      if (flagCurrent) {
        for (let j = lastMarkerIndex; j < i; j++) {
          line1[j].data.intersects = true;
        }

        flagCurrent = false;
      }
      lastMarkerIndex = i;
    }

    for (let j = 0; j < line2.length - 1; j++) {
      const b1 = line2[j],
        b2 = line2[j + 1];
      if (intersects(a1, a2, b1, b2)) {
        flagCurrent = true;
        break;
      }
    }
  }

  if (line1.at(-1)?.data.marker && flagCurrent) {
    for (let i = lastMarkerIndex; i < line1.length - 1; i++) {
      line1[i].data.intersects = true;
    }
  }

  return line1;
};
