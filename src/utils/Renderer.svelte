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
    type Selection,
    lastSelected,
    updateLastSelected,
    type FlagSelection,
    type PointSelection,
    type HandleSelection,
    flagPoints,
    addFlagPoint,
  } from ".";
  import { getWindowPoint, render as renderCanvas, transformPoint } from "./renderLogic";

  let canvas: HTMLCanvasElement = null as any;

  $: ctx = canvas ? canvas.getContext("2d")! : null;

  let mouse = new Point(0, 0);

  let size = 0;

  type Dragging = {
    type: Selection["type"];
    data: Partial<
      Omit<HandleSelection, "type"> &
        Omit<PointSelection, "type"> &
        Omit<FlagSelection, "type">
    >;
    offset: Point;
    dragged: boolean;
  };
  let dragging: Dragging | null = null;

  onMount(() => {
    const removableListeners: [EventTarget, string, Function][] = [];
    const bindRemovable = <T extends EventTarget, K extends keyof HTMLElementEventMap>(
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
      // mouse stuff
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      mouse.x = ((x - canvas.width / 2) / (canvas.width / 2)) * CONSTANTS.scale;
      mouse.y = (-(y - canvas.height / 2) / (canvas.height / 2)) * CONSTANTS.scale;

      if (dragging) {
        dragging.dragged = true;
        points.update((p) => {
          if (!dragging) return p;
          if (dragging.type === "point") {
            p[dragging.data.point!].set(
              new Point(mouse.x - dragging.offset.x, mouse.y - dragging.offset.y)
            );
          } else if (dragging.type === "handle") {
            p[dragging.data.point!].handles[dragging.data.handle!].set(
              new Point(
                mouse.x - dragging.offset.x - p[dragging.data.point!].x,
                mouse.y - dragging.offset.y - p[dragging.data.point!].y
              )
            );
            if ($config.algorithm === "cubic-spline")
              p[dragging.data.point!].makeCollinear(dragging.data.handle!);
          } else if (dragging.type === "flag") {
            const path = $state.generatedPoints.map((point) =>
              transformPoint(point, canvas)
            );
            const m = transformPoint(mouse, canvas);
            const nearestPoint = path.indexOf(
              path.reduce((a, b) => (a.distance(m) < b.distance(m) ? a : b))
            );
            $flagPoints[dragging.data.flag!].index = nearestPoint;
          }
          return p;
        });
      }
    });

    bindRemovable(canvas, "mousedown", (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      mouse.x = ((x - canvas.width / 2) / (canvas.width / 2)) * CONSTANTS.scale;
      mouse.y = (-(y - canvas.height / 2) / (canvas.height / 2)) * CONSTANTS.scale;

      // selection stuff
      const m = transformPoint(mouse, canvas);
      $state.selected = null;
      if ($state.visible.points) {
        const selectedPoint = $points.findIndex(
          (point) =>
            transformPoint(point, canvas).distance(m) <=
            CONSTANTS.point.radius * (size / CONSTANTS.scale)
        );

        if (selectedPoint >= 0) {
          $state.selected = {
            type: "point",
            point: selectedPoint,
          } as Selection;
        }
      }
      if ($state.visible.handles) {
        $points.forEach((point, pointIndex) => {
          const handleIndex = point.handles.findIndex(
            (handle) =>
              transformPoint(point.add(handle), canvas).distance(m) <=
              CONSTANTS.point.handle.radius * (size / CONSTANTS.scale)
          );
          if (handleIndex !== -1) {
            $state.selected = {
              type: "handle",
              point: pointIndex,
              handle: handleIndex,
            } as Selection;
          }
        });
      }

      if ($state.visible.flags) {
        const path = $state.generatedPoints.map((point) => transformPoint(point, canvas));
        const selectedFlag = $flagPoints
          .map((point) => {
            const pathPoint = path[point.index];
            return new Point(pathPoint.x, pathPoint.y);
          })
          .findIndex(
            (point) =>
              point.distance(m) <= CONSTANTS.flag.radius * (size / CONSTANTS.scale)
          );

        if (selectedFlag >= 0) {
          $state.selected = {
            type: "flag",
            flag: selectedFlag,
          } as Selection;
        }
      }
      // dragging stuff
      if (!$state.selected) {
        if ($state.editingMode === "pathPoint") {
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
        } else if ($state.editingMode === "flagPoint") {
          // spawn new flag
          const path = $state.generatedPoints.map((point) =>
            transformPoint(point, canvas)
          );
          if (path.length < 2) return;

          const m = transformPoint(mouse, canvas);
          const nearestPoint = path.indexOf(
            path.reduce((a, b) => (a.distance(m) < b.distance(m) ? a : b))
          );

          addFlagPoint(nearestPoint);
        }
      } else {
        if ($state.selected.type === "handle") {
          const { point, handle } = $state.selected;
          dragging = {
            type: "handle",
            data: {
              point,
              handle,
            },
            offset: mouse.subtract($points[point].add($points[point].handles[handle])),
            dragged: false,
          };
        } else if ($state.selected.type === "point") {
          dragging = {
            type: $state.selected.type,
            data: $state.selected,
            offset: new Point(
              mouse.x - $points[$state.selected.point].x,
              mouse.y - $points[$state.selected.point].y
            ),
            dragged: false,
          };
        } else if ($state.selected.type === "flag") {
          dragging = {
            type: "flag",
            data: $state.selected,
            offset: new Point(
              mouse.x - $state.generatedPoints[$state.selected.flag].x,
              mouse.y - $state.generatedPoints[$state.selected.flag].y
            ),
            dragged: false,
          };
        }
        0;
      }
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

    bindRemovable(document, "mouseup", () => {
      if (!dragging || dragging.dragged) {
        pushHistory();
      }

      if (dragging && !dragging.dragged) {
        if (JSON.stringify($state.selected) === JSON.stringify($lastSelected)) {
          $state.selected = null;
        }
      }
      updateLastSelected();

      dragging = null;
    });

    bindRemovable(document, "keydown", (e) => {
      if (
        (e.target as HTMLElement).tagName.toLowerCase() === "input" ||
        (e.target as HTMLElement).tagName.toLowerCase() === "textarea"
      )
        return;
      if (e.key === "Backspace" || e.key === "Delete") {
        if (!$state.selected || !["point", "flag"].includes($state.selected.type)) {
          points.update((p) => {
            p.pop();
            if (p.length > 0 && p.at(-1)!.handles.length > 1) {
              p.at(-1)!.handles.pop();
            }
            return p;
          });

          pushHistory();
        } else {
          if ($state.selected.type === "flag") {
            flagPoints.update((p) => {
              if ($state.selected?.type !== "flag") return p;
              p.splice($state.selected.flag, 1);
              return p;
            });
            $state.selected = null;
            pushHistory();
          } else {
            points.update((p) => {
              if ($state.selected?.type !== "point") return p;
              p.splice($state.selected.point, 1);
              return p;
            });
            $state.selected = null;

            pushHistory();
          }
        }
      } else if (e.key === "Escape") {
        $state.selected = null;
        updateLastSelected();
      } else if (
        e.key === "ArrowLeft" &&
        $state.selected &&
        $state.selected.type === "point"
      ) {
        const amt = e.shiftKey ? 0.2 : 2;
        points.update((p) => {
          p[($state.selected as PointSelection)?.point].x -= amt;
          return p;
        });
      } else if (
        e.key === "ArrowRight" &&
        $state.selected &&
        $state.selected.type === "point"
      ) {
        const amt = e.shiftKey ? 0.2 : 2;
        points.update((p) => {
          p[($state.selected as PointSelection)?.point].x += amt;
          return p;
        });
      } else if (
        e.key === "ArrowUp" &&
        $state.selected &&
        $state.selected.type === "point"
      ) {
        const amt = e.shiftKey ? 0.2 : 2;
        points.update((p) => {
          p[($state.selected as PointSelection)?.point].y += amt;
          return p;
        });
      } else if (
        e.key === "ArrowDown" &&
        $state.selected &&
        $state.selected.type === "point"
      ) {
        const amt = e.shiftKey ? 0.2 : 2;
        points.update((p) => {
          p[($state.selected as PointSelection)?.point].y -= amt;
          return p;
        });
      } else if (e.key.toLowerCase() === "z" && e.ctrlKey) undo();
    });

		// @ts-expect-error
    bindRemovable(window, "beforeunload", (e) => {
      e.preventDefault();
			// @ts-expect-error
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
    $flagPoints;
    $state;
    $config;
    size;
    renderCanvas(ctx, mouse);
  }
</script>

<canvas width={size} height={size} bind:this={canvas} />
