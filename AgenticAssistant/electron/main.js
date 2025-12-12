const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const waitOn = require('wait-on'); // We'll need this, or simple retry logic

let mainWindow;
let backendProcess;

const BACKEND_PORT = 3000;
const FRONTEND_URL = 'http://localhost:5173'; // For dev. In prod: `file://${path.join(__dirname, '../dist/index.html')}`

function startBackend() {
    const serverPath = path.join(__dirname, '../backend/server.js');
    console.log('Starting Backend from:', serverPath);

    // Spawn server.js as a child process
    backendProcess = spawn('node', [serverPath], {
        env: { ...process.env, PORT: BACKEND_PORT, ELECTRON_RUN: 'true' },
        stdio: 'inherit' // Pipe output so we can see logs
    });

    backendProcess.on('error', (err) => {
        console.error('Failed to start backend:', err);
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: "Agentic Assistant Dashboard",
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        // Dark theme frame
        backgroundColor: '#0f172a'
    });

    // In development, load the Vite server. 
    // In production, we would load the built index.html
    mainWindow.loadURL(FRONTEND_URL);

    // mainWindow.webContents.openDevTools(); // Optional debugging
}

app.whenReady().then(() => {
    startBackend();

    // Wait for backend to be ready (simple delay for MVP, better to use wait-on or health check)
    setTimeout(() => {
        createWindow();
    }, 3000);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// Clean exit
app.on('before-quit', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
});
