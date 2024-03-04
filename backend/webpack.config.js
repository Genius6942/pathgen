import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  mode: "production", // "production" | "development" | "none"
  entry: "./src/index.ts", // path to your main TypeScript file
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "bundle.js", // output bundle file
    path: path.resolve(__dirname, "build"), // output directory
  },
  target: "node",
};
