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
</script>

<main class="h-screen flex flex-col">
  <div class="flex-grow flex justify-center">
    <div class="relative p-4 items-center" style="aspect-ratio: 1/1">
      <div class="h-full flex justify-center items-center">
        <Renderer />
      </div>
    </div>
    <div class="flex flex-col gap-5">
      <div
        class="flex gap-3 p-5 w-[500px] border-white border-2 rounded-3xl m-10 flex-col items-stretch flex-grow"
      >
        <div
          class="flex flex-col gap-2 overflow-auto scrollbar"
          bind:this={container}
          style={`max-height: ${initialHeight}px`}
        >
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

          <div class="flex gap-3 relative items-center">
            <label class="relative">
              <input
                type="checkbox"
                bind:checked={$state.visible.handles}
                class="toggle"
              />
              Show handles
            </label>
            <div class="border-r-2 border-white h-7"></div>
            <label class="relative">
              <input type="checkbox" bind:checked={$state.visible.flags} class="toggle" />
              Show flags
            </label>
          </div>

          {#if pathPoint}
            <h1 class="text-3xl mt-3">Point Config</h1>
            <label class="relative">
              <input type="checkbox" bind:checked={pathPoint.reverse} class="toggle" />
              Reverse here
            </label>
          {/if}

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
        </div>
        <div class="border-t-2 mt-auto py-2 border-transparent">
          <div class="flex gap-3 items-center relative justify-between">
            <button class="button" on:click={() => undo(1)}>Undo</button>
            <div class="h-7 border-r-2 border-white"></div>
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
