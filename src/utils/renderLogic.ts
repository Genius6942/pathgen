import { get } from "svelte/store";

import { CONSTANTS, Point, config, flagPoints, points, state } from ".";

const numberToColor = (input: number): string => {
  input = Math.min(1, Math.max(-1, input));

  // Map the input range [-1, 1] to the hue range [0, 360]
  const hue = (input + 1) * 272;

  // Return the color as an HSL string
  return `hsl(${hue}, 100%, 50%)`;
};

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

export const rotatePoint = <T extends Point>(origin: Point, point: T, angle: number) => {
  const px = point.x - origin.x;
  const py = point.y - origin.y;

  // Rotate points
  const x = px * Math.cos(angle) + py * Math.sin(angle);
  const y = -px * Math.sin(angle) + py * Math.cos(angle);

  // Translate point back
  const fx = x + origin.x;
  const fy = y + origin.y;

  return point.clone().set({ x: fx, y: fy });
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
    ctx.strokeStyle = get(state).visible.coloredPath
      ? numberToColor(path[i].speed / get(config).bot.maxVelocity)
      : CONSTANTS.path.color;
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
  const layer = get(state).visible.layer;
  const hws = get(state).handlesWhenSelected;
  const s = get(state).selected;

  get(points).forEach((point, pointIndex) => {
    if (!point.layers.includes(layer)) return;
    if (hws && (!s || s.type === "flag" || s.point !== pointIndex)) return;

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
  const layer = get(state).visible.layer;
  const hws = get(state).handlesWhenSelected;
  const s = get(state).selected;

  get(points).forEach((point, pointIndex) => {
    if (!point.layers.includes(layer)) return;
    if (hws && (!s || s.type === "flag" || s.point !== pointIndex)) return;
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
  const layer = get(state).visible.layer;
  get(points).forEach((point, index) => {
    if (!point.layers.includes(layer)) return;
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

export const drawBot = (ctx: CanvasRenderingContext2D) => {
  const bot = get(config).bot;
  const botIndex = get(state).visible.highlightIndex;
  const genPoints = get(state).generatedPoints;
  const location = genPoints[botIndex];
  const botCorners = [
    location.add(new Point(bot.width / 2, bot.length / 2)),
    location.add(new Point(bot.width / 2, -bot.length / 2)),
    location.add(new Point(-bot.width / 2, -bot.length / 2)),
    location.add(new Point(-bot.width / 2, bot.length / 2)),
  ]
    .map((point) =>
      rotatePoint(
        location,
        point,
        -genPoints[botIndex === genPoints.length - 1 ? botIndex - 1 : botIndex + 1].angle(
          location
        ) +
          Math.PI / 2
      )
    )
    .map((point) => transformPoint(point, ctx.canvas));

  ctx.beginPath();
  ctx.moveTo(botCorners[0].x, botCorners[0].y);
  [...botCorners.slice(1), botCorners[0]].forEach((point) =>
    ctx.lineTo(point.x, point.y)
  );
  ctx.strokeStyle = CONSTANTS.bot.color;
  ctx.stroke();
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

const renderHighlightedPoint = (ctx: CanvasRenderingContext2D, index: number) => {
  const path = get(state).generatedPoints.map((point) =>
    transformPoint(point, ctx.canvas)
  );
  if (path.length < 2) return;

  const point = path[index];
  ctx.beginPath();
  ctx.arc(point.x, point.y, (0.7 * ctx.canvas.height) / CONSTANTS.scale, 0, Math.PI * 2);
  ctx.fillStyle = numberToColor(path[index].speed / get(config).bot.maxVelocity);
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
  const { visible } = get(state);
  clearCanvas(ctx);
  drawBackground(ctx);
  drawBoundaries(ctx);
  drawPath(ctx);
  if (visible.handles) {
    drawHandleLinks(ctx);
    drawHandles(ctx, mouse);
  }
  if (visible.points) drawPoints(ctx, mouse);
  if (visible.flags) drawFlagPoints(ctx, mouse);
  if (get(state).editingMode === "flagPoint") renderNearestPoint(ctx, mouse);
  if (visible.highlightIndex >= 0)
    renderHighlightedPoint(ctx, get(state).visible.highlightIndex);
  if (visible.highlightIndex >= 0 && visible.bot) drawBot(ctx);
  // drawMouse(ctx, mouse);
};
