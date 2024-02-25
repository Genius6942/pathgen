<script lang="ts">
  import { onMount } from "svelte";
  import { points, config } from "./state";
  import { CONSTANTS, PathPoint, Point, clearHistory, pushHistory, state, undo } from ".";
  import { getWindowPoint, render as renderCanvas, transformPoint } from "./renderLogic";

  let canvas: HTMLCanvasElement = null as any;

  $: ctx = canvas ? canvas.getContext("2d")! : null;

  let mouse = new Point(0, 0);

  let size = 0;

  let dragging: {
    index: number;
    offset: Point;
    dragged: boolean;
  } | null = null;

  let initialized = false;

  onMount(() => {
    if (initialized) return;

    const resize = () => {
      const container = canvas.parentElement!;
      size = Math.min(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", resize);
    resize();

    renderCanvas(canvas.getContext("2d")!, mouse);

    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      mouse.x = ((x - canvas.width / 2) / (canvas.width / 2)) * CONSTANTS.scale;
      mouse.y = (-(y - canvas.height / 2) / (canvas.height / 2)) * CONSTANTS.scale;
    });
    canvas.addEventListener("mousedown", (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      mouse.x = ((x - canvas.width / 2) / (canvas.width / 2)) * CONSTANTS.scale;
      mouse.y = (-(y - canvas.height / 2) / (canvas.height / 2)) * CONSTANTS.scale;
    });

    const keydown = (e: KeyboardEvent) => {
      let found = true;
      switch (e.key.toLowerCase()) {
        case "z":
          e.ctrlKey && undo();
          break;
        default:
          found = false;
          break;
      }

      if (found) e.preventDefault();
    };

    document.querySelector("#undo")?.addEventListener("click", undo);

    window.addEventListener("keydown", keydown);

    canvas.addEventListener("mousedown", () => {
      const m = transformPoint(mouse, canvas);
      $state.selected = $points.findIndex(
        (point) =>
          transformPoint(point, canvas).distance(m) <=
          CONSTANTS.point.radius * (size / CONSTANTS.scale)
      );

      if ($state.selected === -1) {
        // spawn new point
        points.update((p) => {
          p.push(new PathPoint(mouse.x, mouse.y, { flags: {} }));
          return p;
        });
      } else {
        dragging = {
          index: $state.selected,
          offset: new Point(
            mouse.x - $points[$state.selected].x,
            mouse.y - $points[$state.selected].y
          ),
          dragged: false,
        };
        0;
      }
    });

    document.addEventListener("mouseup", (e) => {
      if (dragging && !dragging.dragged) {
        e.stopImmediatePropagation();
        const p = getWindowPoint($points[dragging.index], canvas);
        p.x += 20;
        const index = dragging.index;
        // showMenu([{ label: "Delete", action: () => $points.splice(index, 1) }], p);
      } else {
        pushHistory();
      }

      dragging = null;
    });

    document.addEventListener("mousemove", () => {
      if (dragging) {
        dragging.dragged = true;
        points.update((p) => {
          p[dragging?.index!].set(
            new Point(mouse.x - dragging?.offset.x!, mouse.y - dragging?.offset.y!)
          );
          return p;
        });
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" || e.key === "Delete") {
        if ($state.selected === -1) {
          points.update((p) => {
            p.pop();
            return p;
          });

					pushHistory();
        } else {
          points.update((p) => {
            p.splice($state.selected, 1);
            return p;
          });
          $state.selected = -1;

					pushHistory();
        }
      } else if (e.key === "Escape") {
        $state.selected = -1;
      }
    });
    // very cursed thing to get it to render on initial load
    setTimeout(() => {
      mouse.x = 0;
      setTimeout(() => {
        mouse.x = 0;
        clearHistory();
      }, 100);
    });

    initialized = true;
  });

  $: if (ctx) {
    // dependencies for rerendering
    $points;
    $state;
    $config;
    size;
    renderCanvas(ctx, mouse);
  }
</script>

<canvas width={size} height={size} bind:this={canvas} class="cursor-none" />
