document.addEventListener('DOMContentLoaded', () => {
    const updateContainer = document.getElementById('update-container');
    const downloadButton = document.getElementById('download-button');
    const appDiv = document.getElementById('app');
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
		window.addEventListener('beforeunload', (event) => {
			event.preventDefault();
			event.returnValue = '';
		});
    } else {
        console.log('ipcRenderer is not available');
    }
});