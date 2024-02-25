<script lang="ts">
  import Renderer from "./utils/Renderer.svelte";
  import { config, load, save, saveAs, state, undo } from "./utils/state";
</script>

<main>
  <div class="h-screen flex justify-center">
    <div class="relative flex-grow p-4 items-center">
      <div class="h-full flex justify-center items-center">
        <Renderer />
      </div>
    </div>
    <!-- delete this div later to expand box for more controls -->
    <div class="my-auto">
      <div
        class="flex gap-3 p-5 w-[500px] border-black dark:border-white border-2 rounded-3xl m-10 flex-col items-stretch"
      >
        <div class="border-t-2 mt-auto py-2 border-transparent">
          <div class="flex gap-3 items-center relative justify-between">
            <button class="button" on:click={undo}>Undo</button>
            <div class="h-7 border-r-2 border-white"></div>
            <div class="flex items-center gap-3">
              <label class="button"
                >AutoSav{$config.autosave ? "ing" : "e"}
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
    </div>
  </div>
  <!-- menu -->
  <div
    class="flex-col items-stretch absolute hidden border-white rounded-2xl border-2 -translate-y-1/2 gap-2"
    id="menu"
  ></div>
</main>
