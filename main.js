const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const log = require('electron-log');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, './assets/icons/png/64x64.png')
    });
    mainWindow.loadFile('index.html');
	
	mainWindow.webContents.on('will-prevent-unload', (event) => {
		const options = {
			type: 'question',
			buttons: ['Stay', 'Leave'],
			message: 'Are you sure you want to leave?',
			detail: 'Changes that you made may not be saved.',
		};
		const response = dialog.showMessageBoxSync(mainWindow, options)
		if (response === 1) event.preventDefault();
	});
	
    autoUpdater.logger = log;
    autoUpdater.logger.transports.file.level = 'info';

    autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'wahaha303',
        repo: 'ICCPlus-Desktop',
        token: process.env.AUTO_UPDATE_TOKEN
    });
	
	autoUpdater.autoDownload = false;

    autoUpdater.checkForUpdates();
}

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

autoUpdater.on('update-available', () => {
    log.info('Update available.');
    if (mainWindow) {
        mainWindow.webContents.send('update-available');
    }
});

autoUpdater.on('update-not-available', () => {
    log.info('Update not available.');
});

autoUpdater.on('error', (error) => {
    log.error('Error in auto-updater:', error);
});

ipcMain.on('open-update-page', (event, url) => {
    shell.openExternal(url);
});
