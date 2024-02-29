<script lang="ts">
  import { onMount } from "svelte";
  import { points, config } from "./state";
  import {
    CONSTANTS,
    PathPoint,
    Point,
    clearHistory,
    pushHistory,
    state,
    undo,
  } from ".";
  import {
    getWindowPoint,
    render as renderCanvas,
    transformPoint,
  } from "./renderLogic";

  let canvas: HTMLCanvasElement = null as any;

  $: ctx = canvas ? canvas.getContext("2d")! : null;

  let mouse = new Point(0, 0);

  let size = 0;

  let dragging: {
    index: number;
    offset: Point;
    dragged: boolean;
  } | null = null;

  onMount(() => {
    const removableListeners: [EventTarget, string, Function][] = [];
    const bindRemovable = <
      T extends EventTarget,
      K extends keyof HTMLElementEventMap,
    >(
      item: T,
      event: K,
      listener: (this: T, ev: HTMLElementEventMap[K]) => any,
      options?: boolean | AddEventListenerOptions
    ) => {
      // @ts-ignore
      item.addEventListener(event, listener, options);

      // Return a function to remove the event listener
      removableListeners.push([item, event, listener]);
    };

    const resize = () => {
      const container = canvas.parentElement!;
      size = Math.min(container.clientWidth, container.clientHeight);
    };

    bindRemovable(window, "resize", resize);
    resize();

    renderCanvas(canvas.getContext("2d")!, mouse);

    bindRemovable(canvas, "mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      mouse.x = ((x - canvas.width / 2) / (canvas.width / 2)) * CONSTANTS.scale;
      mouse.y =
        (-(y - canvas.height / 2) / (canvas.height / 2)) * CONSTANTS.scale;
    });

    bindRemovable(canvas, "mousedown", (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      mouse.x = ((x - canvas.width / 2) / (canvas.width / 2)) * CONSTANTS.scale;
      mouse.y =
        (-(y - canvas.height / 2) / (canvas.height / 2)) * CONSTANTS.scale;
    });

    bindRemovable(document, "keydown", (e) => {
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
    });


    bindRemovable(canvas, "mousedown", () => {
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

    bindRemovable(document, "mouseup", (e) => {
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

    bindRemovable(document, "mousemove", () => {
      if (dragging) {
        dragging.dragged = true;
        points.update((p) => {
          p[dragging?.index!].set(
            new Point(
              mouse.x - dragging?.offset.x!,
              mouse.y - dragging?.offset.y!
            )
          );
          return p;
        });
      }
    });

    bindRemovable(document, "keydown", (e) => {
      if (
        (e.target as HTMLElement).tagName.toLowerCase() === "input" ||
        (e.target as HTMLElement).tagName.toLowerCase() === "textarea"
      )
        return;
      if (e.key === "Backspace" || e.key === "Delete") {
        if ($state.selected === -1) {
          points.update((p) => {
            console.log(p);
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

    return () => {
      removableListeners.forEach((removable) =>
        removable[0].removeEventListener(removable[1], removable[2] as any)
      );
    };
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
