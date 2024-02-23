import { writable, get } from "svelte/store";
import { Point } from ".";
import type { Background } from "./background";
import { pathAlgorithms, type GeneratedPoint } from "../gen";

export class PathPoint extends Point {
  flags: { [key: string]: number | boolean };
  constructor(
    x: number,
    y: number,
    options: {
      flags: { [key: string]: boolean | number };
    }
  ) {
    super(x, y);

    this.flags = options.flags || {};
  }
}

export const points = writable<PathPoint[]>([]);

type Method = "catmull-rom";

export const config = writable({
  method: "catmull-rom" as Method,
  background: "over-under" as Background,
  autosave: false,
});

export const state = writable({
  selected: -1,
  generatedPoints: [] as GeneratedPoint[],
  fileHandle: null as FileSystemFileHandle | null,
});

points.subscribe((p) => {
  if (p.length < 2) return state.update((s) => ({ ...s, generatedPoints: [] }));
  const method = get(config).method;
  const algorithm = pathAlgorithms[method];
  const waypoints = p.map((point) => point.clone());
  const first = waypoints[0];
  const second = waypoints[1];
  const last = waypoints[waypoints.length - 1];
  const firstGhostPoint = first.multiply(2).subtract(second);
  waypoints.unshift(firstGhostPoint);
  waypoints.push(last);

  state.update((s) => {
    s.generatedPoints = algorithm(waypoints);
    return s;
  });
});

export const exportPoints = () => {
  return {
    flags: {
      "front-wings": "boolean",
      "back-wings": "boolean",
      intake: "number",
    },
    points: get(points).map((point) => point.export()),
  };
};

export const importPoints = (data: any) => {
  if (!data.flags || !data.points) throw alert("invalid file");
  points.update((p) => {
    p.splice(
      0,
      p.length,
      ...data.p.map(
        (point: any) =>
          new PathPoint(point.x, point.y, {
            flags: point.flags,
          })
      )
    );
    return p;
  });
};
