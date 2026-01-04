let updateContainer, migrateContainer, downloadButton, cancelButton, appDiv;

document.addEventListener('DOMContentLoaded', async () => {
    updateContainer = document.getElementById('update-container');
    migrateContainer = document.getElementById('migrate-container');
    downloadButton = document.getElementById('download-button');
    cancelButton = document.getElementById('cancel-button');
    appDiv = document.getElementById('app');

    if (location.protocol === 'file:') {
        await migrateFromFileOrigin();
    }

    if (location.host.startsWith('localhost')) {
        await runImportIfNeeded();
    }

    setupUpdaterUI();
});

function setupUpdaterUI() {
    const updatePageUrl = 'https://github.com/wahaha303/ICCPlus-Desktop/releases/latest';

    if (window.electron && window.electron.ipcRenderer) {
        window.electron.ipcRenderer.on('update-available', () => {
            appDiv.style.display = 'none';
            updateContainer.classList.remove('hidden');
        });
        
        downloadButton.addEventListener('click', () => {
            window.electron.ipcRenderer.send('open-update-page', updatePageUrl);
            appDiv.removeAttribute('style');
            updateContainer.classList.add('hidden');
        });

        cancelButton.addEventListener('click', () => {
            appDiv.removeAttribute('style');
            updateContainer.classList.add('hidden');
        });
    } else {
        console.log('ipcRenderer is not available');
    }
}

async function migrateFromFileOrigin() {
    if (!window.electron?.ipcRenderer) return;

    const result = {};
    const dbs = await indexedDB.databases();

    appDiv.style.display = 'none';
    migrateContainer.classList.remove('hidden');

    for (const { name, version } of dbs) {
        if (!name) continue;

        const req = indexedDB.open(name, version);

        result[name] = await new Promise((resolve) => {
            req.onsuccess = () => {
                const db = req.result;
                const stores = {};
                const storeNames = Array.from(db.objectStoreNames);
                let done = 0;

                if (storeNames.length === 0) {
                    resolve({ version, stores });
                    return;
                }

                storeNames.forEach((storeName) => {
                    const tx = db.transaction(storeName, 'readonly');
                    const store = tx.objectStore(storeName);
                    const cursorReq = store.openCursor();
                    const records = [];

                    cursorReq.onsuccess = () => {
                        const cursor = cursorReq.result;
                        if (cursor) {
                            let key = cursor.key;

                            if (typeof key === 'string' && key.includes('app.asar')) key = key.split('app.asar')[1];
                            records.push({
                                key: key,
                                value: cursor.value
                            });
                            cursor.continue();
                        } else {
                            stores[storeName] = {
                                keyPath: store.keyPath,
                                autoIncrement: store.autoIncrement,
                                records
                            };
                            if (++done === storeNames.length) {
                                resolve({ version, stores });
                            }
                        }
                    };
                });
            };
        });
    }

    window.electron.ipcRenderer.send('idb-exported', result);
    window.electron.ipcRenderer.send('switch-to-localhost');
}

async function runImportIfNeeded() {
    if (!window.electron?.ipcRenderer) return;
    if (localStorage.getItem('idbImportedOnce')) return;

    try {
        appDiv.style.display = 'none';
        migrateContainer.classList.remove('hidden');

        await importToIndexedDB();

        localStorage.setItem('idbImportedOnce', 'true');
        window.electron.ipcRenderer.send('idb-import-success');
    } catch (e) {
        console.error('IDB import failed', e);
        localStorage.removeItem('idbImportedOnce');
    }
}

async function importToIndexedDB() {
    if (!location.host.startsWith('localhost')) return;
    if (!window.electron?.ipcRenderer) return;
    if (localStorage.getItem('idbImportedOnce')) return;

    try {
        const data = await window.electron.ipcRenderer.invoke('get-migrated-idb-data');
        if (!data || Object.keys(data).length === 0) return;

        for (const [dbName, { version, stores }] of Object.entries(data)) {
            await new Promise((resolve, reject) => {
                const req = indexedDB.open(dbName, version);

                req.onupgradeneeded = () => {
                    const db = req.result;
                    for (const [storeName, meta] of Object.entries(stores)) {
                        if (!db.objectStoreNames.contains(storeName)) {
                            db.createObjectStore(storeName, {
                                keyPath: meta.keyPath ?? undefined,
                                autoIncrement: meta.autoIncrement ?? false
                            });
                        }
                    }
                };

                req.onsuccess = () => {
                    const db = req.result;
                    try {
                        for (const [storeName, { keyPath, records }] of Object.entries(stores)) {
                            const tx = db.transaction(storeName, 'readwrite');
                            const store = tx.objectStore(storeName);

                            records.forEach(({ key, value }) => {
                                keyPath ? store.put(value) : store.put(value, key);
                            });

                            tx.onerror = () => reject(tx.error);
                        }
                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                };

                req.onerror = () => reject(req.error);
            });
        }
        localStorage.setItem('idbImportedOnce', 'true');
    } catch (err) {
        console.error('IndexedDB import failed:', err);
        localStorage.removeItem('idbImportedOnce');
    }
}

function openDB(name, version) {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(name, version);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}