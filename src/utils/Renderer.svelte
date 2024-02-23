<script lang="ts">
  import { onMount } from "svelte";
  import { points, settings } from "./state";
  import { CONSTANTS, Point, parseIntersections } from ".";
  import { writable } from "svelte/store";
  import fieldImage from "../assets/field.png";
  import { catmullRom } from "../gen";

  let size = 0;

  let canvas: HTMLCanvasElement = null as any;

  $: scale = size / CONSTANTS.scale;

  const transformPoint = (point: Point) => {
    const p = point.clone();
    p.x = point.x * (canvas.width / 2 / CONSTANTS.scale) + canvas.width / 2;
    p.y = point.y * (canvas.height / 2 / -CONSTANTS.scale) + canvas.height / 2;
    return p;
  };

  const getWindowPoint = (point: Point) => {
    const p = transformPoint(point);
    const rect = canvas.getBoundingClientRect();
    return new Point(p.x + rect.left, p.y + rect.top);
  };

  const mouse = writable(new Point(0, 0));
  const field = new Image();
  field.src = fieldImage;

  onMount(() => {
		const container = canvas.parentElement as HTMLDivElement;
    const resize = () => {
      size = Math.min(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", resize);
    resize();

    const ctx = canvas.getContext("2d")!;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(field, 0, 0, canvas.width, canvas.height);

      // draw boundaries?
      CONSTANTS.barriers.forEach((boundary) => {
        ctx.beginPath();
        ctx.strokeStyle = "white";
        const points = [...boundary].map((item) => transformPoint(item));
        ctx.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.stroke();
      });

      // draw path
      if ($points.length >= 2) {
        const waypoints = $points.map((point) => point.clone());

        if ($settings.method === "catmull-rom") {
          const first = waypoints[0];
          const second = waypoints[1];
          const last = waypoints[waypoints.length - 1];
          const firstGhostPoint = first.multiply(2).subtract(second);
          waypoints.unshift(firstGhostPoint);

          waypoints.push(last);

          // Path Generation
          const path = parseIntersections(
            catmullRom(waypoints),
            CONSTANTS.barriers.flat()
          ).map((point) => transformPoint(point));
          // Draw the generated path

          for (let i = 0; i < path.length - 1; i++) {
            ctx.beginPath();
            ctx.moveTo(path[i].x, path[i].y);
            ctx.lineTo(path[i + 1].x, path[i + 1].y);
            ctx.strokeStyle = path[i].data.intersects
              ? CONSTANTS.path.error
              : CONSTANTS.path.color;
            ctx.lineWidth = CONSTANTS.path.thickness;
            ctx.stroke();
          }
        }
      }

      // draw points?
      $points.forEach((point) => {
        const p = transformPoint(point);
        const m = transformPoint($mouse);
        ctx.beginPath();
        ctx.arc(p.x, p.y, CONSTANTS.point.radius * scale, 0, Math.PI * 2);
        ctx.lineWidth = CONSTANTS.point.border.thickness * scale;
        ctx.strokeStyle = CONSTANTS.point.border.color;
        ctx.fillStyle =
          p.distance(m) <= CONSTANTS.point.radius * scale
            ? CONSTANTS.point.hover
            : CONSTANTS.point.color;

        ctx.fill();
        ctx.stroke();
      });

      // draw mouse?
      const m = transformPoint($mouse);
      ctx.beginPath();
      ctx.arc(m.x, m.y, 1, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.closePath();

      requestAnimationFrame(render);
    };

    field.addEventListener("load", () => {
      requestAnimationFrame(render);
    });
  });
</script>

<canvas width={size} height={size} bind:this={canvas} />
