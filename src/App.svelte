<script lang="ts">
  import Renderer from "./utils/Renderer.svelte";
  import {
    addFlag,
    config,
    flagPoints,
    load,
    points,
    removeFlag,
    save,
    saveAs,
    state,
    undo,
  } from "./utils/state";
  import { pathAlgorithms } from "./gen";
  import { CONSTANTS, Point, saveState } from "$utils";
  import Graph from "$utils/Graph.svelte";
  import { backgrounds } from "$utils/background";

  import Fa from "svelte-fa";
  import { faAdd, faDownLong, faUpLong } from "@fortawesome/free-solid-svg-icons";

  let newFlagName = "";
  let newFlagType: "boolean" | "number" = "boolean";

  $: point =
    $state.selected && $state.selected.type === "point"
      ? $points[$state.selected.point]
      : $state.selected?.type === "flag"
        ? $flagPoints[$state.selected.flag]
        : null;

  $: pathPoint =
    $state.selected && $state.selected.type === "point"
      ? $points[$state.selected.point]
      : null;

  let initialHeight = -1;
  let container: HTMLDivElement | null = null;
  $: if (container && initialHeight < 0) initialHeight = container.offsetHeight;

  $: maxLayer =
    $points.reduce((a, b) => Math.max(a, ...b.layers), 0) ??
    Math.max(...pathPoint?.layers!);
</script>

<main class="h-screen flex flex-col select-none">
  <div class="flex-grow flex justify-center">
    <div class="flex flex-col justify-center items-center gap-3 p-3">
      <button
        class={`translate-y-0 transition-all hover:-translate-y-1 ${$state.visible.layer === maxLayer ? "opacity-0 cursor-default" : "opacity-100"}`}
        on:click={() => {
          $state.visible.layer = Math.min(maxLayer, $state.visible.layer + 1);
        }}
      >
        <Fa icon={faUpLong} size="lg" />
      </button>
      <div class="whitespace-nowrap w-12 border-y-2 border-white text-center py-2">
        {$state.visible.layer === 0 ? "All" : `Layer ${$state.visible.layer}`}
      </div>
      <button
        class={`translate-y-0 transition-all hover:translate-y-1 ${$state.visible.layer === 0 ? "opacity-0 cursor-default" : "opacity-100"}`}
        on:click={() => {
          $state.visible.layer = Math.max(0, $state.visible.layer - 1);
        }}
      >
        <Fa icon={faDownLong} size="lg" />
      </button>
    </div>
    <div class="relative p-4 items-center" style="aspect-ratio: 1/1">
      <div
        class="h-full flex justify-center items-center border-white border-4 rounded-2xl overflow-hidden"
      >
        <Renderer />
      </div>
    </div>
    <div class="flex flex-col gap-5 mx-10 my-5">
      <div
        class="flex gap-3 pb-5 w-[500px] border-white border-2 rounded-3xl flex-col items-stretch flex-grow overflow-hidden"
      >
        <div
          class="flex flex-col gap-2 overflow-auto scrollbar flex-grow px-5 pt-5 pb-2 mr-2 border-b-2 border-dashed border-white"
          bind:this={container}
          style={`max-height: ${initialHeight}px`}
        >
          {#if initialHeight >= 0}
            <!-- POINT DESCRIPTOR -->
            <h1 class="text-3xl w-full pb-2 border-b-2 border-b-white flex items-center">
              {#if point}
                {#if point instanceof Point}
                  Point at ({point.x.toFixed(2)}, {point.y.toFixed(2)})
                {:else}
                  Flag at index {point.index}
                {/if}
              {:else}
                No point selected
              {/if}
              <div class="ml-auto text-xl">
                {#if $config.autosave}
                  {#if $saveState < 0}
                    <span class="text-green-500">Saved!</span>
                  {:else}
                    <span class="text-blue-500">Saving...</span>
                  {/if}
                {/if}
              </div>
            </h1>

            <!-- PATH CONFIG -->
            <h1 class="text-3xl">Path config</h1>
            <label>
              Algorithm:
              <select
                value={$config.algorithm}
                on:change={(e) => {
                  // @ts-ignore
                  const newValue = e.target.value;

                  if (
                    !confirm(
                      "Are you sure you want to change the algorithm? This will wipe all points (methods are incompatible)"
                    )
                  ) {
                    // @ts-ignore
                    e.target.value = $config.algorithm;
                    return;
                  }

                  $points = [];

                  $config.algorithm = newValue;
                }}
                class="bg-transparent text-lg border-white border rounded-full p-1"
              >
                {#each Object.keys(pathAlgorithms) as algorithm}
                  <option value={algorithm}>
                    {algorithm
                      .split("-")
                      .map((item) => item[0].toUpperCase() + item.slice(1))
                      .join(" ")}
                  </option>
                {/each}
              </select>
            </label>
            {#if $config.algorithm === "cubic-spline"}
              <label>
                K: ({$config.k.toFixed(1)})
                <input
                  type="range"
                  class="slider"
                  min={1}
                  max={10}
                  step={0.1}
                  bind:value={$config.k}
                />
              </label>
            {/if}
            <label>
              Background:
              <select
                bind:value={$config.background}
                class="bg-transparent text-lg border-white border rounded-full p-1"
              >
                {#each Object.keys(backgrounds) as background}
                  <option value={background}>
                    {background
                      .split("-")
                      .map((item) => item[0].toUpperCase() + item.slice(1))
                      .join(" ")}
                  </option>
                {/each}
              </select>
            </label>

            <!-- BOT CONFIG -->
            <h1 class="text-3xl mt-3">Bot Config</h1>
            <div class="flex gap-3 items-center">
              <label>
                Max velocity:
                <input
                  type="number"
                  class="bg-transparent border-2 border-white border-dashed rounded-2xl px-[2px] py-[1px] text-center outline-none focus:border-solid transition-all duration-200 ease-in-out w-20"
                  bind:value={$config.bot.maxVelocity}
                />
              </label>
              <div class="divider"></div>
              <label>
                Max acceleration:
                <input
                  type="number"
                  class="bg-transparent border-2 border-white border-dashed rounded-2xl px-[2px] py-[1px] text-center outline-none focus:border-solid transition-all duration-200 ease-in-out w-20"
                  bind:value={$config.bot.maxAcceleration}
                />
              </label>
            </div>
            <div class="flex gap-3 items-center">
              <label>
                Width:
                <input
                  type="number"
                  class="bg-transparent border-2 border-white border-dashed rounded-2xl px-[2px] py-[1px] text-center outline-none focus:border-solid transition-all duration-200 ease-in-out w-20"
                  bind:value={$config.bot.width}
                />
              </label>
              <div class="divider"></div>
              <label>
                Length:
                <input
                  type="number"
                  class="bg-transparent border-2 border-white border-dashed rounded-2xl px-[2px] py-[1px] text-center outline-none focus:border-solid transition-all duration-200 ease-in-out w-20"
                  bind:value={$config.bot.length}
                />
              </label>
            </div>

            <!-- EDITING CONFIG -->
            <h1 class="text-3xl mt-3">Editing Config</h1>
            <label>
              Editing mode:
              <select
                bind:value={$state.editingMode}
                class="bg-transparent text-lg border-white border rounded-full p-1"
              >
                <option value="pathPoint">Add path points</option>
                <option value="flagPoint">Add flag points</option>
              </select>
            </label>

            <div class="flex gap-3 relative items-center flex-wrap">
              Show:

              <label class="relative flex gap-2">
                Points
                <input
                  type="checkbox"
                  bind:checked={$state.visible.points}
                  class="toggle"
                />
              </label>
              <div class="divider" />
              <label class="relative flex gap-2">
                Handles
                <input
                  type="checkbox"
                  bind:checked={$state.visible.handles}
                  class="toggle"
                />
              </label>
              <div class="divider" />
              <label class="relative flex gap-2">
                Flags
                <input
                  type="checkbox"
                  bind:checked={$state.visible.flags}
                  class="toggle"
                />
              </label>

              <div class="divider ml-14" />

              <label class="relative flex gap-2 whitespace-nowrap">
                Colored Path
                <input
                  type="checkbox"
                  bind:checked={$state.visible.coloredPath}
                  class="toggle"
                />
              </label>

              <div class="divider" />

              <label class="relative flex gap-2 whitespace-nowrap">
                Bot
                <input type="checkbox" bind:checked={$state.visible.bot} class="toggle" />
              </label>
            </div>
            <label class="flex items-center relative gap-3">
              Show handles only when selected
              <input
                type="checkbox"
                bind:checked={$state.handlesWhenSelected}
                class="toggle"
              />
            </label>

            <!-- POINT CONFIG -->
            {#if pathPoint}
              <h1 class="text-3xl mt-3">Point Config</h1>
              <label class="relative">
                <input type="checkbox" bind:checked={pathPoint.reverse} class="toggle" />
                Reverse here
              </label>
            {/if}
            {#if point}
              <div class="flex items-center relative gap-2 flex-wrap">
                Layers:
                {#each Array(maxLayer)
                  .fill(0)
                  .map((_, i) => i + 1) as i}
                  <label class="relative flex whitespace-nowrap gap-2">
                    {i}
                    <input
                      type="checkbox"
                      on:change={() => {
                        if (point) {
                          if (point.layers.includes(i)) {
                            point.layers = point.layers.filter((layer) => layer !== i);
                          } else {
                            point.layers.push(i);
                          }
                        }
                      }}
                      checked={point.layers.includes(i)}
                      class="toggle"
                    />
                  </label>
                  <div class="divider" />
                {/each}
                <button on:click={() => point && point.layers.push(maxLayer + 1)}>
                  <Fa icon={faAdd} />
                </button>
              </div>
            {/if}

            <!-- FLAGS -->
            <h1 class="text-3xl mt-3">Flags</h1>
            {#if !point}
              {#each Array(Object.keys($config.flags).length)
                .fill(null)
                .map( (_, i) => ({ key: Object.keys($config.flags)[i], type: $config.flags[Object.keys($config.flags)[i]] }) ) as flag}
                <div class="flex items-center gap-3">
                  <button class="button py-[2px]" on:click={() => removeFlag(flag.key)}
                    >Delete</button
                  >
                  <div class="h-7 border-white border-r-2" />
                  {flag.key}: {flag.type}
                </div>
              {/each}

              <div class="flex gap-2 items-center">
                New flag:
                <input
                  type="text"
                  size={Math.max(newFlagName.length, 7)}
                  class="bg-transparent border-2 border-white border-dashed rounded-2xl px-[2px] py-[1px] text-center outline-none focus:border-solid transition-all duration-200 ease-in-out"
                  bind:value={newFlagName}
                  on:keydown={(e) => {
                    if (e.key === "Enter") {
                      if (newFlagName.trim() === "") return;

                      try {
                        addFlag(newFlagName, newFlagType);
                      } catch (e) {
                        // @ts-expect-error
                        alert(e.message);
                      }
                      newFlagName = "";
                    }
                  }}
                />
                <select bind:value={newFlagType} class="bg-transparent">
                  <option value="boolean">Boolean</option>
                  <option value="number">Number</option>
                </select>
                <button
                  class="button"
                  on:click={() => {
                    if (newFlagName.trim() === "") return;

                    try {
                      addFlag(newFlagName, newFlagType);
                    } catch (e) {
                      // @ts-expect-error
                      alert(e.message);
                    }
                    newFlagName = "";
                  }}
                >
                  Create
                </button>
              </div>
            {:else}
              {#if Object.keys($config.flags).length === 0}
                (No flags set)
              {/if}
              {#each Object.keys($config.flags).map( (_, i) => ({ key: Object.keys($config.flags)[i], type: $config.flags[Object.keys($config.flags)[i]] }) ) as flag}
                <div class="flex items-center gap-3">
                  <label class="items-center cursor-pointer relative">
                    <input
                      type="checkbox"
                      value=""
                      class="toggle"
                      on:change={(e) => {
                        // @ts-ignore
                        if (e.target.checked && point) {
                          point.flagsAny[flag.key] = flag.type === "boolean" ? false : 0;
                        } else if (point) {
                          delete point.flagsAny[flag.key];
                          point = point;
                        }
                      }}
                    />

                    <span class="ms-3 text-sm font-medium text-gray-300">
                      Enable {flag.key}
                    </span>
                  </label>
                  {#if flag.key in point.flags}
                    {#if flag.type === "boolean"}
                      <label class="items-center cursor-pointer relative">
                        <input
                          type="checkbox"
                          value=""
                          class="toggle"
                          bind:checked={point.flagsAny[flag.key]}
                        />

                        <span class="ms-3 text-sm font-medium text-gray-300">
                          {flag.key}
                        </span>
                      </label>
                    {:else}
                      <label for={flag.key}>{flag.key}</label>
                      <input
                        type="number"
                        id={flag.key}
                        class="bg-transparent border-2 border-white border-dashed rounded-2xl px-[2px] py-[1px] text-center outline-none focus:border-solid transition-all duration-200 ease-in-out"
                        bind:value={point.flagsAny[flag.key]}
                      />
                    {/if}
                  {/if}
                </div>
              {/each}
            {/if}
          {/if}
        </div>
        <div class="border-t-2 mt-auto border-transparent px-5">
          <div class="flex gap-3 items-center relative justify-between">
            <button class="button" on:click={() => undo(1)}>Undo</button>
            <div class="divider"></div>
            <div class="flex items-center gap-3">
              <label class="button">
                AutoSav{$config.autosave ? "ing" : "e"}
                <!-- ™️ -->
                <input
                  type="checkbox"
                  class="hidden"
                  id="autosave"
                  bind:checked={$config.autosave}
                />
              </label>
              <button id="import" class="button" on:click={load}>Import</button>
              <button id="save" class="button" on:click={save}>Save</button>
              <button id="saveas" class="button" on:click={saveAs}>Save As</button>
            </div>
          </div>
        </div>
      </div>
      <Graph />
    </div>
  </div>

  <!-- menu (not in use) -->
  <div
    class="flex-col items-stretch absolute hidden border-white rounded-2xl border-2 -translate-y-1/2 gap-2"
    id="menu"
  ></div>

  <!-- footer -->
  <div class="h-12 bg-slate-900 text-white flex items-center text-xl px-5 font-mono">
    Copyright &COPY; <a href="https://haelp.dev" class="ml-2 underline" target="_blank"
      >Joshua Liu</a
    >, Brandon Ni {new Date().getFullYear()}
    <span class="ml-auto">v{CONSTANTS.version}</span>
  </div>
</main>
