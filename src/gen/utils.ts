import { catmullRom } from ".";
import { PathPoint, Point } from "../utils";

export const findDerivative = (p0: Point, p1: Point, p2: Point, p3: Point, t: number) => {
  const c1 = p0.multiply(-0.5).add(p2.multiply(0.5));
  const c2 = p0
    .multiply(0.5 * 2)
    .add(p1.multiply(0.5 - 3))
    .add(p2.multiply(3 - 2 * 0.5))
    .add(p3.multiply(-0.5));
  const c3 = p0
    .multiply(-0.5)
    .add(p1.multiply(2 - 0.5))
    .add(p2.multiply(0.5 - 2))
    .add(p3.multiply(0.5));

  const t2 = t * t;

  const C1 = c1;
  const C2 = c2.multiply(2 * t);
  const C3 = c3.multiply(3 * t2);
  const newD = C1.add(C2).add(C3);

  return Math.sqrt(newD.x * newD.x + newD.y * newD.y);
};

export const findPoint = (p0: Point, p1: Point, p2: Point, p3: Point, t: number) => {
  const c0 = p1;
  const c1 = p0.multiply(-0.5).add(p2.multiply(0.5));
  const c2 = p0
    .multiply(0.5 * 2)
    .add(p1.multiply(0.5 - 3))
    .add(p2.multiply(3 - 2 * 0.5))
    .add(p3.multiply(-0.5));
  const c3 = p0
    .multiply(-0.5)
    .add(p1.multiply(2 - 0.5))
    .add(p2.multiply(0.5 - 2))
    .add(p3.multiply(0.5));

  const t2 = t * t;
  const t3 = t2 * t;

  const newPoint = c0.add(c1.multiply(t)).add(c2.multiply(t2)).add(c3.multiply(t3));
  return new GeneratedPoint(newPoint.x, newPoint.y);
};

export interface GeneratedPointExport {
	x: number;
	y: number;
	speed: number;
	index: number;
}

export class GeneratedPoint extends Point {
	speed: number = 0;
	index: number = 0;

	constructor(x: number = 0, y: number = 0, speed: number = 0, index: number = 0) {
		super(x, y);
		this.speed = speed;
		this.index = index;
	}

	export(): GeneratedPointExport {
		return {
			x: this.x,
			y: this.y,
			speed: this.speed,
			index: this.index,
		}
	}

	static from(point: GeneratedPointExport) {
		const p = new GeneratedPoint(point.x, point.y);
		p.speed = point.speed;
		p.index = point.index;
		return p;
	}

	clone() {
		return new GeneratedPoint(this.x, this.y, this.speed, this.index) as typeof this;
	}
}
