const express = require('express');
const path = require('path');

async function startServer(port = 42007) {
    const app = express();
    const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
    const basePath = isDev ? __dirname : process.resourcesPath;

    app.use(express.static(basePath));
    app.get('/__health', (_, res) => {
        res.json({ app: 'ICCPlus-Desktop' });
    });
    app.use((req, res) => {
        res.sendFile(path.join(basePath, 'index.html'));
    });

    const server = await new Promise((resolve, reject) => {
        const s = app.listen(port, () => resolve(s));
        s.on('error', reject);
    });

    console.log(`Server running on http://localhost:${port}`);
    return { server, port: port };
}

module.exports = { startServer };
