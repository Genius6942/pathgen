<script lang="ts">
  import Renderer from "./utils/Renderer.svelte";
  import { config, state } from "./utils/state";

  config.subscribe((v) => {
    if (v.autosave && !$state.fileHandle) {
      alert("Please save the file before enabling autosave");
      config.update((v) => ({ ...v, autosave: false }));
    }
  });
</script>

<main>
  <div class="h-screen flex justify-center">
    <div class="relative flex-grow p-4">
      <div class="h-full flex justify-center items-center">
        <Renderer />
      </div>
    </div>
    <div
      class="flex gap-3 p-5 w-[500px] border-black dark:border-white border-2 rounded-3xl m-10 flex-col items-stretch"
    >
      <div class="border-t-2 mt-auto py-2 border-white">
        <div class="flex gap-3 items-center">
          <div class="flex border-2 px-2 rounded-full border-transparent items-center">
            AutoSave™️
            <input
              type="checkbox"
              class="ml-1"
              id="autosave"
              bind:checked={$config.autosave}
            />
          </div>
          <button id="import" class="button">Import</button>
          <button id="save" class="button">Save</button>
          <button id="saveas" class="button">Save As</button>
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
