import { defineConfig } from "vite";
/// <reference types="node" />
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    {
      name: "post-build",
      apply: "build",
      writeBundle: () => {
        const filePath = path.resolve(__dirname, "dist", "index.html");
        let fileContent = fs.readFileSync(filePath, "utf-8");
        let lines = fileContent.split("\n");

        const startComment = "<!-- BEGIN ERUDA -->";
        const endComment = "<!-- END ERUDA -->";

        const startIndex = lines.findIndex((line) => line.includes(startComment));
        const endIndex = lines.findIndex((line) => line.includes(endComment));

        if (startIndex !== -1 && endIndex !== -1) {
          lines.splice(startIndex, endIndex - startIndex + 1);
          fileContent = lines.join("\n");
          fs.writeFileSync(filePath, fileContent);
        }
      },
    },
  ],
  resolve: {
    alias: {
      $lib: path.resolve("./src/lib"),
      $utils: path.resolve("./src/utils"),
    },
  },
});
