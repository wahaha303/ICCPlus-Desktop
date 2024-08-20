const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow;

function createWindow () {
	const win = new BrowserWindow({
		width: 1600,
		height: 900,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
		icon: path.join(__dirname, './assets/icons/png/64x64.png')
	});
	win.loadFile('index.html');
	autoUpdater.checkForUpdates();
}

app.whenReady().then(() => {
	createWindow();
	autoUpdater.checkForUpdates();
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

autoUpdater.on('update-available', () => {
	if (mainWindow) {
		mainWindow.webContents.send("update-available");
	}
});

autoUpdater.on('update-downloaded', () => {
	if (mainWindow) {
		mainWindow.webContents.send("update-downloaded");
	}
});

ipcMain.on("restart-app", () => {
	autoUpdater.quitAndInstall();
});