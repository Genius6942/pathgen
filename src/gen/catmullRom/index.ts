import { PathPoint, Point } from "$utils";
import { GeneratedPoint, findDerivative, findPoint } from "../utils";
import { config as configStore } from "$utils";
import { get } from "svelte/store";
import { CatmullRom } from "./core";

const inner_catmullRom = (path: Point[], k = 3) => {
  if (path.length < 2) return [];

  const config = get(configStore);

  const generator = new CatmullRom(path);

  const res = generator.generatePath(
    config.bot.maxVelocity,
    config.bot.maxAcceleration,
    k
  );

  return res.map(([_, point, speed]) => new GeneratedPoint(point.x, point.y, speed));
};

export const catmullRom = (path: PathPoint[], k = 3): GeneratedPoint[] => {
  if (path.length < 2) {
    return [];
  }

  const paths: Point[][] = [];
  let reverse = !path[0].reverse;
  paths.push([Point.from(path[0])]);

  path.slice(1, path.length - 1).forEach((point) => {
    paths.at(-1)?.push(Point.from(point));

    if (point.reverse) {
      paths.push([Point.from(point)]);
    }
  });

  paths.at(-1)?.push(Point.from(path.at(-1)!));

  const generatedPaths = paths
    // generation
    .map((p) => inner_catmullRom(p))
    // apply reversing to speeds
    .map((gen) => {
      reverse = !reverse;

      return reverse
        ? gen.map((point) => {
            point.speed *= -1;
            return point;
          })
        : gen;
    })
    // remove duplicate points
    .map((gen, i) => (i === 0 ? gen : gen.slice(1)));

  return generatedPaths.flat();
};
