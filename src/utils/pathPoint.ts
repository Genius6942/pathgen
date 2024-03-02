import { CONSTANTS, Point, type PointExport } from ".";

export interface PathPointOptions {
  flags?: { [key: string]: number | boolean };
  handles?: { x: number; y: number }[];
}

export interface PathPointExport {
  x: number;
  y: number;
  flags: NonNullable<PathPointOptions["flags"]>;
  handles: { x: number; y: number }[];
}

export class PathPoint extends Point {
  flags: NonNullable<PathPointOptions["flags"]>;
  handles: Point[];

  constructor(x: number, y: number, options: PathPointOptions = {}) {
    super(x, y);
    this.flags = options.flags || {};
    const handles = options.handles || [];
    this.handles = handles.map((handle) => new Point(handle.x, handle.y));
  }

  get flagsAny() {
    return this.flags as { [key: string]: any };
  }

  set flagsAny(val: any) {
    this.flags = val;
  }

  clone() {
    return new PathPoint(this.x, this.y, {
      flags: this.flags,
      handles: this.handles.map((handle) => ({ x: handle.x, y: handle.y })),
    }) as this;
  }

  export(): PathPointExport {
    return {
      x: this.x,
      y: this.y,
      flags: JSON.parse(JSON.stringify(this.flags)),
      handles: this.handles.map((handle) => ({ x: handle.x, y: handle.y })),
    };
  }

  static from(point: PathPointExport) {
    return new PathPoint(point.x, point.y, {
      flags: point.flags,
      handles: point.handles,
    });
  }
}
