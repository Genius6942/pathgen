<script lang="ts">
  import { onMount } from "svelte";
  import { config, state } from "./state";
  import { Point } from "./point";

  let canvas: HTMLCanvasElement | null = null;
  $: width = canvas ? canvas?.parentElement?.offsetWidth! - 0.0001 : 100;

  const margin = {
    top: 30,
    left: 60,
    right: 30,
    bottom: 40,
  };
  const lineWidth = 2;
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

    let mouse: number | null = null;

    bindRemovable(window, "mousemove", (e) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouse =
        e.clientY > rect.top + margin.top && e.clientY < rect.bottom - margin.bottom
          ? e.clientX - rect.left
          : null;
    });

    let animationId = 0;
    const render = () => {
      if (!canvas) {
        animationId = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext("2d")!;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = ctx.fillStyle = "white";
      ctx.setLineDash([10, 10]);

      ctx.lineWidth = lineWidth;

      // CHART LINES
      // left line
      ctx.beginPath();
      ctx.moveTo(margin.left, margin.top);
      ctx.lineTo(margin.left, canvas.height - margin.bottom);
      ctx.stroke();

      // bottom line
      ctx.beginPath();
      ctx.moveTo(margin.left, canvas.height - margin.bottom);
      ctx.lineTo(canvas.width - margin.right, canvas.height - margin.bottom);
      ctx.stroke();

      // middle horizontal line
      ctx.setLineDash([3, 17]);
      ctx.beginPath();
      ctx.moveTo(
        margin.left,
        margin.top + (canvas.height - margin.bottom - margin.top) / 2
      );
      ctx.lineTo(
        canvas.width - margin.right,
        margin.top + (canvas.height - margin.bottom - margin.top) / 2
      );
      ctx.stroke();

      // LEFT NUMBERS
      ctx.font = "20px monospace";

      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      // top number
      ctx.fillText(
        Math.round($config.bot.maxVelocity).toString(),
        margin.left - 5,
        margin.top
      );

      // middle number
      ctx.fillText(
        "0",
        margin.left - 5,
        margin.top + (canvas.height - margin.bottom - margin.top) / 2
      );

      // bottom number
      ctx.fillText(
        Math.round(-$config.bot.maxVelocity).toString(),
        margin.left - 5,
        canvas.height - margin.bottom
      );

      // BOTTOM NUMBERS
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      // left number
      ctx.fillText("0", margin.left, canvas.height - margin.bottom + 5);

      // right number
      ctx.fillText(
        $state.generatedPoints.length.toString(),
        canvas.width - margin.right,
        canvas.height - margin.bottom + 5
      );

      // GRAPH
      ctx.setLineDash([]);
      for (let i = 0; i < $state.generatedPoints.length - 1; i++) {
        const start = $state.generatedPoints[i];
        const end = $state.generatedPoints[i + 1];
        ctx.beginPath();
        ctx.moveTo(
          margin.left +
            (i * (canvas.width - margin.left - margin.right)) /
              ($state.generatedPoints.length - 1),
          margin.top +
            (canvas.height - margin.bottom - margin.top) *
              (1 - start.speed / $config.bot.maxVelocity)
        );
        ctx.lineTo(
          margin.left +
            ((i + 1) * (canvas.width - margin.left - margin.right)) /
              ($state.generatedPoints.length - 1),
          margin.top +
            (canvas.height - margin.bottom - margin.top) *
              (1 - end.speed / $config.bot.maxVelocity)
        );
        ctx.stroke();

        // MOUSE LINE
        if (mouse && mouse > margin.left && mouse < canvas.width - margin.right) {
          ctx.beginPath();
          ctx.moveTo(mouse, margin.top);
          ctx.lineTo(mouse, canvas.height - margin.bottom);
          ctx.stroke();

          $state.visible.highlightIndex = Math.round(
            (($state.generatedPoints.length - 1) * (mouse - margin.left)) /
              (canvas.width - margin.left - margin.right)
          );
        } else $state.visible.highlightIndex = -1;
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      removableListeners.forEach((removable) =>
        removable[0].removeEventListener(removable[1], removable[2] as any)
      );

      cancelAnimationFrame(animationId);
    };
  });
</script>

<div class="border-2 border-white rounded-3xl mx-10 overflow-hidden">
  <canvas bind:this={canvas} {width} height="200"></canvas>
</div>
