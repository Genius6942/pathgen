import { get } from "svelte/store";

import { CONSTANTS, Point, config, points, state } from ".";

// Background shit
import { backgrounds, type Background } from "./background";

const backgroundImages: { [key in Background]: HTMLImageElement } = {} as any;

Object.keys(backgrounds).forEach((key) => {
  const img = new Image();
  img.src = backgrounds[key as Background];
  backgroundImages[key as Background] = img;
});

// utils stuff

export const transformPoint = (point: Point, canvas: HTMLCanvasElement) => {
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
  const path = get(state).generatedPoints.map((point) =>
    transformPoint(point, ctx.canvas)
  );
  if (path.length < 2) return;

  for (let i = 0; i < path.length - 1; i++) {
    ctx.beginPath();
    ctx.moveTo(path[i].x, path[i].y);
    ctx.lineTo(path[i + 1].x, path[i + 1].y);
    ctx.strokeStyle = false ? CONSTANTS.path.error : CONSTANTS.path.color;
    ctx.lineWidth = CONSTANTS.path.thickness;
    ctx.stroke();
  }
};

export const drawPoints = (ctx: CanvasRenderingContext2D, mouse: Point) => {
  const scale = ctx.canvas.height / CONSTANTS.scale;
  get(points).forEach((point, index) => {
    const p = transformPoint(point, ctx.canvas);
    const m = transformPoint(mouse, ctx.canvas);
    ctx.beginPath();
    ctx.arc(p.x, p.y, CONSTANTS.point.radius * scale, 0, Math.PI * 2);
    ctx.lineWidth = CONSTANTS.point.border.thickness * scale;
    ctx.strokeStyle = CONSTANTS.point.border.color;
    ctx.fillStyle =
      get(state).selected === index
        ? CONSTANTS.point.selected
        : p.distance(m) <= CONSTANTS.point.radius * scale
        ? CONSTANTS.point.hover
        : CONSTANTS.point.color;

    ctx.fill();
    ctx.stroke();
  });
};

export const drawMouse = (ctx: CanvasRenderingContext2D, mouse: Point) => {
  const m = transformPoint(mouse, ctx.canvas);
  ctx.beginPath();
  ctx.arc(m.x, m.y, 3, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.closePath();
};

export const render = (ctx: CanvasRenderingContext2D, mouse: Point) => {
  clearCanvas(ctx);
  drawBackground(ctx);
  drawBoundaries(ctx);
  drawPath(ctx);
  drawPoints(ctx, mouse);
  drawMouse(ctx, mouse);
};
