export interface PointExport {
  x: number;
  y: number;
}

export class Point {
  x: number;
  y: number;

  // x and y coordinates in cartesian plane
  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  // adds x coords of each point and y coords of each point
  static add(p1: Point, p2: Point) {
    return new Point(p1.x + p2.x, p1.y + p2.y);
  }

  add(p: Point) {
    return this.clone().set(Point.add(this, p)) as this;
  }

  static sum(...points: Point[]) {
    let total = new Point(0, 0);
    points.forEach((point) => {
      total = Point.add(total, point);
    });
    return total;
  }

  // (x1, y1) - (x2, y2) = (x1 - x2, y1 - y2)
  static subtract(p1: Point, p2: Point) {
    return new Point(p1.x - p2.x, p1.y - p2.y);
  }

  subtract(p: Point) {
    return this.clone().set(Point.subtract(this, p)) as this;
  }

  // d * (x, y) = (dx, dy)
  multiply(d: number): this {
    return this.clone().set({ x: this.x * d, y: this.y * d }) as this;
  }

  // d * (x, y) = (x/d, y/d)
  divide(d: number) {
    return this.clone().set({ x: this.x / d, y: this.y / d });
  }

  static equals(p1: Point, p2: Point) {
    return p1.x === p2.x && p1.y === p2.y;
  }

  equals(p: Point) {
    return Point.equals(this, p);
  }

  static distance(p1: Point, p2: Point) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  distance(p: Point = new Point(0, 0)) {
    return Point.distance(this, p);
  }

  magnitude() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  }

  // rotates p2 theta radians about p1
  static rotate(p1: Point, p2: Point, theta: number) {
    const shifted = new Point(p2.x - p1.x, p2.y - p1.y);
    const xcord = shifted.x * Math.cos(theta) - shifted.y * Math.sin(theta);
    const ycord = shifted.y * Math.cos(theta) + shifted.x * Math.sin(theta);
    return new Point(xcord + p1.x, ycord + p1.y);
  }

  rotate(p: Point, theta: number) {
    return this.clone().set(Point.rotate(this, p, theta)) as this;
  }

  static print(p: Point) {
    console.log(`(${p.x}, ${p.y})`);
  }

  print() {
    Point.print(this);
  }

  static dotProduct(p1: Point, p2: Point) {
    return p1.x * p2.x + p1.y * p2.y;
  }

  dotProduct(p: Point) {
    return Point.dotProduct(this, p);
  }

  // linear interpolation
  // returns p1 * (1 - t) + p2 * t

  static lerp(p1: Point, p2: Point, t: number) {
    // 0 <= t <= 1
    const x = (1 - t) * p1.x + t * p2.x;
    const y = (1 - t) * p1.y + t * p2.y;
    return new Point(x, y);
  }

  lerp(p: Point, t: number) {
    return this.clone().set(Point.lerp(this, p, t)) as this;
  }

	static angle(p1: Point, p2: Point) {
		return Math.atan2(p2.y - p1.y, p2.x - p1.x);
	}

	angle(p: Point) {
		return Point.angle(this, p);
	}

  clone(): this {
    return new (this.constructor as any)(this.x, this.y);
  }

  set(p: Pick<Point, "x" | "y">) {
    this.x = p.x;
    this.y = p.y;
    return this;
  }

  export(): PointExport {
    return {
      x: this.x,
      y: this.y,
    };
  }

  static from(point: PointExport) {
    return new Point(point.x, point.y);
  }
}
