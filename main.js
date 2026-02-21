const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const { startServer } = require('./server');
const { name } = require('./package.json');
const fs = require('fs');
const path = require('path');
const log = require('electron-log');
const Store = require('electron-store').default;
const contextMenu = require('electron-context-menu').default;

const store = new Store();
const PORT = 42007;
let MIGRATION_FILE;
let mainWindow;
let server;

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
    return;
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            autoplayPolicy: 'no-user-gesture-required',
        },
        icon: path.join(__dirname, './assets/icons/png/64x64.png')
    });

    const migrated = store.get('idbMigratedToApp') && !fs.existsSync(MIGRATION_FILE);
    if (migrated) {
        mainWindow.loadURL(`http://localhost:${PORT}`);
    } else {
        mainWindow.loadFile('index.html');
    }
	
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

    setupAutoUpdater();
}

function setupAutoUpdater() {
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

app.whenReady().then(async () => {
    contextMenu();
    try {
        try {
            const result = await startServer(PORT);
            server = result.server;
        } catch (err) {
            if (err.code === 'EADDRINUSE') {
                dialog.showErrorBox('Port In Use', `port ${PORT} is already using in other program.\nPlease exit it and try again.`);
                app.quit();
                return;
            } else {
                throw err;
            }
        }
        MIGRATION_FILE = path.join(app.getPath('userData'), 'idb-migration.json');
        createWindow();
    } catch (err) {
        dialog.showErrorBox('Application Error', err.message);
        app.quit();
    }
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

app.on('before-quit', () => {
    if (server) {
        server.close();
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

ipcMain.on('idb-exported', (_, data) => {
    fs.writeFileSync(MIGRATION_FILE, JSON.stringify(data), 'utf-8');
});

ipcMain.on('open-update-page', (_, url) => {
    shell.openExternal(url);
});

ipcMain.on('switch-to-localhost', () => {
    if (store.get('idbMigratedToApp')) return;
    mainWindow.loadURL(`http://localhost:${PORT}`);
});

ipcMain.handle('get-migrated-idb-data', async () => {
    if (!fs.existsSync(MIGRATION_FILE)) return null;

    return JSON.parse(fs.readFileSync(MIGRATION_FILE, 'utf-8'));
});

ipcMain.on('idb-import-success', () => {
    if (fs.existsSync(MIGRATION_FILE)) {
        fs.unlinkSync(MIGRATION_FILE);
    }

    store.set('idbMigratedToApp', true);
    
    setTimeout(() => {
        app.relaunch();
        app.exit(0);
    }, 3000);
});