import { type ChildProcess, spawn } from "child_process";
import { getFile, getDirectory } from "./fs";
import { watch } from "fs";

let filePath: string;
let directoryPath: string;

(async () => {
  try {
    filePath = await getFile();
    directoryPath = await getDirectory();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  let buildProcess: ChildProcess | null = null;

  watch(filePath, () => {
    if (buildProcess) {
      buildProcess.kill();
    }

    buildProcess = spawn("pros", ["mu"], { cwd: directoryPath });
    buildProcess!.stdout!.on("data", (data) => {
      console.log(data.toString());
    });
    buildProcess!.stderr!.on("data", (data) => {
      console.error(data.toString());
    });
    buildProcess!.on("exit", (code) => {
      console.log(`Child exited with code ${code}`);
    });
  });
})();
