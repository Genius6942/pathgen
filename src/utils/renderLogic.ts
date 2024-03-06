import { get } from "svelte/store";

import { CONSTANTS, Point, config, flagPoints, points, state } from ".";

// Background shit
import { backgrounds, type Background } from "./background";

const backgroundImages: { [key in Background]: HTMLImageElement } = {} as any;

Object.keys(backgrounds).forEach((key) => {
  const img = new Image();
  img.src = backgrounds[key as Background];
  backgroundImages[key as Background] = img;
});

// utils stuff

export const transformPoint = <T extends Point>(point: T, canvas: HTMLCanvasElement) => {
  const p = point.clone();
  p.x = point.x * (canvas.width / 2 / CONSTANTS.scale) + canvas.width / 2;
  p.y = point.y * (canvas.height / 2 / -CONSTANTS.scale) + canvas.height / 2;
  return p;
};

export const getWindowPoint = (point: Point, canvas: HTMLCanvasElement) => {
  const p = transformPoint(point, canvas);
  const rect = canvas.getBoundingClientRect();
  return new Point(p.x + rect.left, p.y + rect.top);
};

// actual rendering logic

export const clearCanvas = (ctx: CanvasRenderingContext2D) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

export const drawBackground = (ctx: CanvasRenderingContext2D) => {
  const background = backgroundImages[get(config).background];
  ctx.drawImage(background, 0, 0, ctx.canvas.width, ctx.canvas.height);
};

export const drawBoundaries = (ctx: CanvasRenderingContext2D) => {
  CONSTANTS.barriers.forEach((boundary) => {
    ctx.beginPath();
    ctx.strokeStyle = "white";
    const points = [...boundary].map((item) => transformPoint(item, ctx.canvas));
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.stroke();
  });
};

export const drawPath = (ctx: CanvasRenderingContext2D) => {
  const scale = ctx.canvas.height / CONSTANTS.scale;

  const path = get(state).generatedPoints.map((point) =>
    transformPoint(point, ctx.canvas)
  );
  if (path.length < 2) return;

  for (let i = 0; i < path.length - 1; i++) {
    ctx.beginPath();
    ctx.moveTo(path[i].x, path[i].y);
    ctx.lineTo(path[i + 1].x, path[i + 1].y);
    ctx.strokeStyle = CONSTANTS.path.color;
    ctx.lineWidth = CONSTANTS.path.thickness * scale;
    ctx.stroke();
  }
};

export const drawFlagPoints = (ctx: CanvasRenderingContext2D, mouse: Point) => {
  const scale = ctx.canvas.height / CONSTANTS.scale;
  const selection = get(state).selected;
  const generatedPath = get(state).generatedPoints;
	if (generatedPath.length < 2) return;
  get(flagPoints)
    .map((point) => {
      const pathPoint = generatedPath[Math.min(point.index, generatedPath.length - 1)];
      return new Point(pathPoint.x, pathPoint.y);
    })
    .forEach((point, index) => {
      const p = transformPoint(point, ctx.canvas);
      const m = transformPoint(mouse, ctx.canvas);
      ctx.beginPath();
      ctx.arc(p.x, p.y, CONSTANTS.flag.radius * scale, 0, Math.PI * 2);
      ctx.lineWidth = CONSTANTS.flag.border.thickness * scale;
      ctx.strokeStyle = CONSTANTS.flag.border.color;
      ctx.fillStyle =
        selection && selection.type === "flag" && selection.flag === index
          ? CONSTANTS.flag.selected
          : p.distance(m) <= CONSTANTS.flag.radius * scale
          ? CONSTANTS.flag.hover
          : CONSTANTS.flag.color;

      ctx.fill();
      ctx.stroke();
    });
};

export const drawHandleLinks = (ctx: CanvasRenderingContext2D) => {
  const scale = ctx.canvas.height / CONSTANTS.scale;

  get(points).forEach((point) => {
    const p = transformPoint(point, ctx.canvas);
    point.handles.forEach((handle) => {
      const h = transformPoint(handle.add(point), ctx.canvas);
      ctx.beginPath();
      ctx.moveTo(h.x, h.y);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = CONSTANTS.point.handle.link.color;
      ctx.lineWidth = CONSTANTS.point.handle.link.thickness * scale;
      ctx.stroke();
    });
  });
};

export const drawHandles = (ctx: CanvasRenderingContext2D, mouse: Point) => {
  const scale = ctx.canvas.height / CONSTANTS.scale;
  const m = transformPoint(mouse, ctx.canvas);

  get(points).forEach((point, pointIndex) => {
    const selection = get(state).selected;
    const selectedHandle = selection && selection.type === "handle" ? selection : null;
    point.handles.forEach((handle, handleIndex) => {
      const h = transformPoint(handle.add(point), ctx.canvas);
      ctx.beginPath();
      ctx.arc(h.x, h.y, CONSTANTS.point.handle.radius * scale, 0, Math.PI * 2);
      ctx.fillStyle =
        selectedHandle &&
        selectedHandle.point === pointIndex &&
        selectedHandle.handle === handleIndex
          ? CONSTANTS.point.handle.selected
          : h.distance(m) <= CONSTANTS.point.handle.radius * scale
          ? CONSTANTS.point.handle.hover
          : CONSTANTS.point.handle.color;
      ctx.strokeStyle = CONSTANTS.point.handle.border.color;
      ctx.fill();
      ctx.stroke();
    });
  });
};

export const drawPoints = (ctx: CanvasRenderingContext2D, mouse: Point) => {
  const scale = ctx.canvas.height / CONSTANTS.scale;
  const selection = get(state).selected;
  get(points).forEach((point, index) => {
    const p = transformPoint(point, ctx.canvas);
    const m = transformPoint(mouse, ctx.canvas);
    ctx.beginPath();
    ctx.arc(p.x, p.y, CONSTANTS.point.radius * scale, 0, Math.PI * 2);
    ctx.lineWidth = CONSTANTS.point.border.thickness * scale;
    ctx.strokeStyle = CONSTANTS.point.border.color;
    ctx.fillStyle =
      selection && selection.type === "point" && selection.point === index
        ? CONSTANTS.point.selected
        : p.distance(m) <= CONSTANTS.point.radius * scale
        ? CONSTANTS.point.hover
        : CONSTANTS.point.color;

    ctx.fill();
    ctx.stroke();
  });
};

export const renderNearestPoint = (ctx: CanvasRenderingContext2D, mouse: Point) => {
  const path = get(state).generatedPoints.map((point) =>
    transformPoint(point, ctx.canvas)
  );
  if (path.length < 2) return;

  const m = transformPoint(mouse, ctx.canvas);
  let nearestPoint = path[0];
  path.forEach((point) => {
    if (point.distance(m) < nearestPoint.distance(m)) {
      nearestPoint = point;
    }
  });

  ctx.beginPath();
  ctx.arc(
    nearestPoint.x,
    nearestPoint.y,
    (0.4 * ctx.canvas.height) / CONSTANTS.scale,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.closePath();
};

export const drawMouse = (ctx: CanvasRenderingContext2D, mouse: Point) => {
  const scale = ctx.canvas.height / CONSTANTS.scale;

  const m = transformPoint(mouse, ctx.canvas);
  ctx.beginPath();
  ctx.arc(m.x, m.y, 0.4 * scale, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.closePath();
};

export const render = (ctx: CanvasRenderingContext2D, mouse: Point) => {
  clearCanvas(ctx);
  drawBackground(ctx);
  drawBoundaries(ctx);
  drawPath(ctx);
  drawFlagPoints(ctx, mouse);
  drawHandleLinks(ctx);
  drawHandles(ctx, mouse);
  if (get(state).editingMode === "flagPoint") renderNearestPoint(ctx, mouse);
  drawPoints(ctx, mouse);
  // drawMouse(ctx, mouse);
};
