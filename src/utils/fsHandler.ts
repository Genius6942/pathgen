export class FSHandler {
  private handle: null | FileSystemFileHandle = null;

  static extension = "pp";

  constructor() {}

  async open() {
    [this.handle] = await window.showOpenFilePicker({
      types: [
        {
          description: "vpp",
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
				suggestedName: "path.pp",
        types: [
          {
            description: "vpp",
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
}
