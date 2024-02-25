export class FSHandler {
  private handle: null | FileSystemFileHandle = null;

  static extension = "vpp";

  constructor() {}

  async open() {
    [this.handle] = await window.showOpenFilePicker({
      types: [
        {
          description: "Vex Pure Pursuit",
          accept: {
            "*/*": [`.${FSHandler.extension}`],
          },
        },
      ],
      multiple: false,
    });

    // this.handle.requestPermission({ mode: "readwrite" });

    const file = await this.handle.getFile();

    return await file.text();
  }

  async write(content: string, newFile?: boolean) {
    if (this.handle === null || newFile) {
      this.handle = await window.showSaveFilePicker({
        suggestedName: "path.vpp",
        types: [
          {
            description: "Vex Pure Pursuit",
            accept: {
              "*/*": [`.${FSHandler.extension}`],
            },
          },
        ],
      });
    }

    const writeHandle = await this.handle.createWritable();
    await writeHandle.write(content);
    await writeHandle.close();
  }

  get active() {
    return this.handle !== null;
  }
}
