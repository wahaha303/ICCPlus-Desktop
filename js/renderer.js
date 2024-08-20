const { ipcRenderer } = require('electron');

const updateContainer = document.getElementById('update-container');
const restartButton = document.getElementById('restart-button');

ipcRenderer.on('update-available', () => {
    updateContainer.classList.remove('hidden');
});

restartButton.addEventListener('click', () => {
    ipcRenderer.send('restart-app');
});
