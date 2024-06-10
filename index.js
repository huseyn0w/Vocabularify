const { app, BrowserWindow, Menu, Tray, ipcMain } = require('electron');
const path = require('path');
require('electron-reload')(__dirname, {
  electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
});

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.setBackgroundColor('#FFFFFF');
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Vocabularify',
      enabled: true
    },
    {
      label: 'Mode',
      submenu: [
        {
          label: 'Light Mode',
          type: 'radio',
          checked: true,
          click: () => {
            mainWindow.webContents.send('set-mode', 'light');
          }
        },
        {
          label: 'Dark Mode',
          type: 'radio',
          click: () => {
            mainWindow.webContents.send('set-mode', 'dark');
          }
        }
      ]
    }
  ]);

  tray.setToolTip('Vocabularify');
  tray.setTitle('Vocabularify');
  tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('resize-window', (event, width, height) => {
  if (mainWindow) {
    mainWindow.setSize(width, height);
  }
});
