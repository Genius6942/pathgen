import { spawn } from "child_process";

export const getFile = () =>
  new Promise<string>((resolve, reject) => {
    if (process.platform === "win32") {
      const child = spawn("powershell.exe", [
        `Add-Type -AssemblyName System.Windows.Forms
				$openFileDialog = New-Object System.Windows.Forms.OpenFileDialog
				$openFileDialog.InitialDirectory = [Environment]::GetFolderPath('Desktop')
				if ($openFileDialog.ShowDialog() -eq 'OK') {
						$filePath = $openFileDialog.FileName
						Write-Output "$filePath"
				} else {
						Write-Error "No file selected"
				}`,
      ]);
      child.stdout.on("data", function (data) {
        resolve(data.toString() as string);
      });
      child.stderr.on("data", function (data) {
        reject(data.toString());
      });
      child.on("exit", function () {
        reject("Process exited");
      });
      child.stdin.end(); //end input
    } else if (process.platform === "darwin") {
      const child = spawn("osascript", [
        "-e",
        'tell app "System Events" to display dialog "Please select a file" default location (path to desktop) with hidden answer',
      ]);
      child.stdout.on("data", function (data) {
        resolve(data.toString().trim());
      });
      child.stderr.on("data", function (data) {
        reject(data.toString());
      });
      child.on("exit", function () {
        reject("Process exited");
      });
      child.stdin.end(); //end input
    } else if (process.platform === "linux") {
      try {
        const child = spawn("zenity", ["--file-selection"]);
        child.stdout.on("data", function (data) {
          resolve(data.toString().trim());
        });
        child.stderr.on("data", function (data) {});
        child.on("exit", function () {
          reject("User cancelled action");
        });
        child.stdin.end(); //end input
      } catch {
        reject("zenity not found, please install (sudo apt-get install zenity)");
      }
    } else {
      reject("Unsupported platform");
    }
  });

export const getDirectory = () =>
	new Promise<string>((resolve, reject) => {
		if (process.platform === "win32") {
			const child = spawn("powershell.exe", [
				`Add-Type -AssemblyName System.Windows.Forms
				$folderBrowser = New-Object System.Windows.Forms.FolderBrowserDialog
				$folderBrowser.RootFolder = [System.Environment+SpecialFolder]::Desktop
				if ($folderBrowser.ShowDialog() -eq 'OK') {
						$folderPath = $folderBrowser.SelectedPath
						Write-Output "$folderPath"
				} else {
						Write-Error "No folder selected"
				}`,
			]);
			child.stdout.on("data", function (data) {
				resolve(data.toString() as string);
			});
			child.stderr.on("data", function (data) {
				reject(data.toString());
			});
			child.on("exit", function () {
				reject("Process exited");
			});
			child.stdin.end(); //end input
		} else if (process.platform === "darwin") {
			const child = spawn("osascript", [
				"-e",
				'tell app "System Events" to choose folder with prompt "Please select a folder"',
			]);
			child.stdout.on("data", function (data) {
				resolve(data.toString().trim());
			});
			child.stderr.on("data", function (data) {
				reject(data.toString());
			});
			child.on("exit", function () {
				reject("Process exited");
			});
			child.stdin.end(); //end input
		} else if (process.platform === "linux") {
			try {
				const child = spawn("zenity", ["--file-selection", "--directory"]);
				child.stdout.on("data", function (data) {
					resolve(data.toString().trim());
				});
				child.stderr.on("data", function (data) {});
				child.on("exit", function () {
					reject("User cancelled action");
				});
				child.stdin.end(); //end input
			} catch {
				reject("zenity not found, please install (sudo apt-get install zenity)");
			}
		} else {
			reject("Unsupported platform");
		}
	});
