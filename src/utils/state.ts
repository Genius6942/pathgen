import { writable } from "svelte/store";
import { Point } from ".";

export class PathPoint extends Point {
  flags: { [key: string]: number | boolean };
  constructor(
    x: number,
    y: number,
    options = Point.defaultOptions as typeof Point.defaultOptions & {
      flags: { [key: string]: boolean | number };
    }
  ) {
    super(x, y, options);

    this.flags = options.flags || {};
  }
}

export const points = writable<PathPoint[]>([]);

type Method = "catmull-rom";

export const settings = writable({
  method: "catmull-rom" as Method,
  selected: -1,
});
