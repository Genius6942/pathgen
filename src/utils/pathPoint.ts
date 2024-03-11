import { CONSTANTS, Point, type PointExport } from ".";

export interface PathPointOptions {
  flags?: { [key: string]: number | boolean };
  handles?: { x: number; y: number }[];
  reverse?: boolean;
  layers?: number[];
}

export interface PathPointExport {
  x: number;
  y: number;
  flags: NonNullable<PathPointOptions["flags"]>;
  handles: { x: number; y: number }[];
  reverse: boolean;
  layers: number[];
}

export class PathPoint extends Point {
  flags: NonNullable<PathPointOptions["flags"]>;
  handles: Point[];
  private _reverse = false;
  layers: number[];

  constructor(x: number, y: number, options: PathPointOptions = {}) {
    super(x, y);
    this.flags = options.flags || {};
    const handles = options.handles || [];
    this.handles = handles.map((handle) => new Point(handle.x, handle.y));
    this.reverse = !!options.reverse;
    this.layers = options.layers || [0];
  }

  get flagsAny() {
    return this.flags as { [key: string]: any };
  }

  set flagsAny(val: any) {
    this.flags = val;
  }

  get reverse() {
    return this._reverse;
  }

  set reverse(value: boolean) {
    this._reverse = value;
    if (this.handles.length >= 2) this.makeCollinear(0);
  }

  /**
   * make all handles fall on the line between handle at `index` and point
   * @param index index of handle to base linear thingy off of
   */
  makeCollinear(index: number) {
    if (index > this.handles.length - 1) return;
    const anchor = this.handles[index];
    const anchorDistance = anchor.distance();

    this.handles.forEach((handle, idx) => {
      if (idx === index) return;
      const distance = handle.distance();
      const ratio = distance / anchorDistance;

      const multiplier = this.reverse ? 1 : -1;

      handle.x = multiplier * anchor.x * ratio;
      handle.y = multiplier * anchor.y * ratio;
    });
  }

  clone() {
    return new PathPoint(this.x, this.y, {
      flags: this.flags,
      handles: this.handles.map((handle) => ({ x: handle.x, y: handle.y })),
      reverse: this.reverse,
      layers: this.layers,
    }) as this;
  }

  export(): PathPointExport {
    return {
      x: this.x,
      y: this.y,
      flags: JSON.parse(JSON.stringify(this.flags)),
      handles: this.handles.map((handle) => ({ x: handle.x, y: handle.y })),
      reverse: this.reverse,
      layers: this.layers,
    };
  }

  static from(point: PathPointExport) {
    return new PathPoint(point.x, point.y, {
      flags: point.flags,
      handles: point.handles,
      reverse: point.reverse,
      layers: point.layers,
    });
  }
}
