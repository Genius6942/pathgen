import { Point } from "$utils";

function choose(n: number, k: number) {
  if (n / 2 < k) {
    k = n - k;
  }
  if (k == 0) {
    return 1;
  }
  if (k > n) {
    return 0;
  }
  let result = 1;
  for (let i = n; i > n - k; i--) {
    result = result * i;
  }
  for (let i = 1; i <= k; i++) {
    result = result / i;
  }
  return result;
}

// generates coefficients for bezier curves expressed in berstein polynomial form
// n is the degree of the bezier curve
function generateBernstein(n: number) {
  const coeffs = [];
  for (let i = 0; i <= n; i++) {
    const coI = [];
    const cof = choose(n, i);
    for (let k = n - i; k >= 0; k--) {
      if (k % 2 == 1) {
        coI.push(-1 * cof * choose(n - i, k));
      } else {
        coI.push(cof * choose(n - i, k));
      }
    }
    while (coI.length < n + 1) {
      coI.push(0);
    }
    coeffs.push(coI);
  }
  return coeffs;
}

export class Bernstein {
  points: Point[];
  coeffs: number[][];
  injected: [number, Point][];
  cumD: [number, number][];
  constructor(
    points: Point[],
    coeffs = generateBernstein(points.length - 1),
    injected = [],
    cumD = []
  ) {
    this.points = points;
    this.coeffs = coeffs;
    this.injected = injected;
    this.cumD = cumD;
  }

  evaluate(t: number) {
    const degree = this.points.length - 1;
    const tCoeffs = [];
    for (let i = 0; i <= degree; i++) {
      let tValue = 0;
      for (let k = 0; k <= degree; k++) {
        tValue += this.coeffs[i][k] * Math.pow(t, degree - k);
      }
      tCoeffs.push(tValue);
    }

    let pt = new Point(0, 0);
    for (let i = 0; i <= degree; i++) {
      pt = Point.add(pt, this.points[i].multiply(tCoeffs[i]));
    }
    return pt;
  }

  // injects numPoints of points into the curve
  inject(numPoints: number) {
    const path: (typeof this)["injected"] = [];
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const addPoint = this.evaluate(t);
      path.push([t, addPoint]);
    }
    this.injected = path;

    return this;
  }

  // generates cumulative Distance LUT
  generateCD() {
    let d = 0;
    const cumDistance: typeof this.cumD = [[0, 0]];

    for (let i = 0; i < this.injected.length - 1; i++) {
      const pointToPointDistance = Point.distance(
        this.injected[i][1],
        this.injected[i + 1][1]
      );
      d += pointToPointDistance;
      cumDistance.push([this.injected[i + 1][0], d]);
    }

    this.cumD = cumDistance;
    return this;
  }

  // gets t-value for a distance value given the cum dist LUT
  getT(dist: number): number {
    for (let i = 1; i < this.cumD.length; i++) {
      if (this.cumD[i][1] >= dist) {
        const dValue1 = new Point(this.cumD[i - 1][0], this.cumD[i - 1][1]);
        const dValue2 = new Point(this.cumD[i][0], this.cumD[i][1]);

        const t = (dist - dValue1.y) / (dValue2.y - dValue1.y);

        const findingT = Point.lerp(dValue1, dValue2, t);
        return findingT.x;
      }
    }

    return 0;
  }

  // injects points based on distance between each 2 points instead of t values
  // adjust -> if true, adjust the distance between by a tiny margin such that the end point of the bezier is contained on the injected bezier
  // if false, no adjustment is made.
  spaceInject(distBetween: number, adjust = true) {
    //default injects 50, generates cD if the injected attribute is empty
    if (this.injected.length == 0) {
      this.inject(50);
      this.generateCD();
    }

    const path: typeof this.injected = [];

    const curveLength = this.cumD[this.cumD.length - 1][1];
    const numPoints = Math.floor(curveLength / distBetween);

    //adjusting distance between
    if (adjust == true) {
      distBetween = curveLength / numPoints;
    }

    for (let i = 0; i < numPoints + 1; i++) {
      const distAtPoint = i * distBetween;
      const t = this.getT(distAtPoint);
      path.push([t, this.evaluate(t)]);
    }
    this.injected = path;
    return this;
  }

  // calculates derivative (velocity)
  derivative() {
    const bez = new Bernstein(this.points, this.coeffs);
    const degree = bez.points.length - 1;
    for (let i = 0; i <= degree; i++) {
      for (let k = 0; k <= degree; k++) {
        bez.coeffs[i][k] *= degree - k;
      }
      bez.coeffs[i].pop();
      bez.coeffs[i].unshift(0);
    }
    return bez;
  }

  //calculates 2nd derivative (acceleration)
  secondDerivative() {
    const bez = new Bernstein(this.points);
    return bez.derivative().derivative();
  }

  // calculates 3rd derivative (jerk)
  thirdDerivative() {
    const bez = new Bernstein(this.points);
    return bez.secondDerivative().derivative();
  }

  // calculates signed curvature at t value
  curvature(t: number) {
    const firstD = this.derivative();
    const secondD = this.secondDerivative();
    const firstDPoint = firstD.evaluate(t);
    const secondDPoint = secondD.evaluate(t);
    const numerator = firstDPoint.x * secondDPoint.y - firstDPoint.y * secondDPoint.x;
    const denominator = Math.pow(firstDPoint.magnitude(), 3);
    return numerator / denominator;
  }
}
