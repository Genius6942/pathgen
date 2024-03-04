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
    type PathPointOptions,
    lastSelected,
    updateLastSelected,
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
    handle: number | null;
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

      let foundHandle = false;
      $points.forEach((point, pointIndex) => {
        const handleIndex = point.handles.findIndex(
          (handle) =>
            transformPoint(point.add(handle), canvas).distance(m) <=
            CONSTANTS.point.handle.radius * (size / CONSTANTS.scale)
        );
        if (handleIndex !== -1) {
          $state.selectedHandle = { point: pointIndex, handle: handleIndex };
          foundHandle = true;
        }
      });

      if (!foundHandle) $state.selectedHandle = null;
    });

    bindRemovable(canvas, "contextmenu", (e) => {
      e.preventDefault();
      const m = transformPoint(mouse, canvas);
      const index = $points.findIndex(
        (point) =>
          transformPoint(point, canvas).distance(m) <=
          CONSTANTS.point.radius * (size / CONSTANTS.scale)
      );
      if (index !== -1) {
        const p = getWindowPoint($points[index], canvas);
        p.x += 20;
        // showMenu([{ label: "Delete", action: () => $points.splice(index, 1) }], p);
      }
    });

    bindRemovable(canvas, "dblclick", () => {
      if ($state.selected !== -1) {
        const p = getWindowPoint($points[$state.selected], canvas);
        p.x += 20;
        // showMenu([{ label: "Delete", action: () => $points.splice($state.selected, 1) }], p);
      }
    });

    bindRemovable(canvas, "mousedown", () => {
      if ($state.selected === -1 && !$state.selectedHandle) {
        // spawn new point
        points.update((p) => {
          const handles: PathPointOptions["handles"] =
            $config.algorithm === "catmull-rom" ? [] : [new Point(8, 0)];
          if (p.length > 1 && ["cubic-spline"].includes($config.algorithm)) {
            p[p.length - 1].handles.push(new Point(-8, 0));
            p[p.length - 1].makeCollinear(0);
          }
          p.push(new PathPoint(mouse.x, mouse.y, { flags: {}, handles }));
          return p;
        });
      } else {
        if ($state.selectedHandle) {
          const { point, handle } = $state.selectedHandle;
          dragging = {
            index: point,
            handle: handle,
            offset: mouse.subtract(
              $points[point].add($points[point].handles[handle])
            ),
            dragged: false,
          };
        } else {
          dragging = {
            index: $state.selected,
            handle: null,
            offset: new Point(
              mouse.x - $points[$state.selected].x,
              mouse.y - $points[$state.selected].y
            ),
            dragged: false,
          };
        }
        0;
      }
    });

    bindRemovable(document, "mouseup", () => {
      if (!dragging || dragging.dragged) {
        pushHistory();
      }

      if (dragging && !dragging.dragged) {
        console.log("eeee");
        if (
          $state.selected === $lastSelected.selected &&
          $state.selectedHandle === $lastSelected.selectedHandle
        ) {
          $state.selected = -1;
          $state.selectedHandle = null;
        }
      }
      updateLastSelected();

      dragging = null;
    });

    bindRemovable(document, "mousemove", () => {
      if (dragging) {
        dragging.dragged = true;
        points.update((p) => {
          dragging = dragging!;
          if (dragging.handle === null) {
            p[dragging.index].set(
              new Point(
                mouse.x - dragging.offset.x,
                mouse.y - dragging.offset.y
              )
            );
          } else {
            p[dragging.index].handles[dragging.handle].set(
              new Point(
                mouse.x - dragging.offset.x - p[dragging.index].x,
                mouse.y - dragging.offset.y - p[dragging.index].y
              )
            );
            if ($config.algorithm === "cubic-spline")
              p[dragging.index].makeCollinear(dragging.handle);
          }
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
            p.pop();
            if (p.length > 0 && p.at(-1)!.handles.length > 1) {
              p.at(-1)!.handles.pop();
            }
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
        $state.selectedHandle = null;
        updateLastSelected();
      } else if (e.key === "ArrowLeft" && $state.selected !== -1) {
        const amt = e.shiftKey ? 0.2 : 2;
        points.update((p) => {
          p[$state.selected].x -= amt;
          return p;
        });
      } else if (e.key === "ArrowRight" && $state.selected !== -1) {
        const amt = e.shiftKey ? 0.2 : 2;
        points.update((p) => {
          p[$state.selected].x += amt;
          return p;
        });
      } else if (e.key === "ArrowUp" && $state.selected !== -1) {
        const amt = e.shiftKey ? 0.2 : 2;
        points.update((p) => {
          p[$state.selected].y += amt;
          return p;
        });
      } else if (e.key === "ArrowDown" && $state.selected !== -1) {
        const amt = e.shiftKey ? 0.2 : 2;
        points.update((p) => {
          p[$state.selected].y -= amt;
          return p;
        });
      }
    });

    window.addEventListener("beforeunload", (e) => {
      e.preventDefault();
      e.returnValue = "";
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

<canvas width={size} height={size} bind:this={canvas} />
