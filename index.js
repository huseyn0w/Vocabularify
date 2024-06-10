const { app, BrowserWindow, Menu, Tray, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
require('electron-reload')(__dirname, {
  electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
});

let mainWindow;
let tray;
let phrases = [];
let currentIndex = 0;
let intervalId;
let currentLanguagePath = 'languages/de/vocabulary.json';

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

  mainWindow.webContents.on('did-finish-load', () => {
    loadPhrases(currentLanguagePath);
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Vocabularify',
      enabled: false
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
    },
    {
      label: 'Language',
      submenu: [
        {
          label: 'Russian -> German',
          type: 'radio',
          checked: true,
          click: () => {
            switchLanguage('languages/de/vocabulary.json');
          }
        },
        {
          label: 'Russian -> French',
          type: 'radio',
          click: () => {
            switchLanguage('languages/fr/vocabulary.json');
          }
        }
      ]
    },
    {
      label: 'About',
      click: () => {
        shell.openExternal('https://github.com/huseyn0w/Vocabularify'); // Replace with your repository URL
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setTitle('Vocabularify');
  tray.setContextMenu(contextMenu);
}

function switchLanguage(filePath) {
  currentLanguagePath = filePath;
  loadPhrases(filePath);
}

function loadPhrases(filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error('Failed to load phrases:', err);
      return;
    }
    const vocabulary = JSON.parse(data);
    phrases = vocabulary.map(entry => `${entry.word_1} - ${entry.word_2}`);
    if (phrases.length > 0) {
      currentIndex = 0;
      displayPhrase(currentIndex);
      clearInterval(intervalId);
      intervalId = setInterval(cyclePhrases, 5000);
    }
  });
}

function displayPhrase(index) {
  const phrase = phrases[index];
  mainWindow.webContents.send('display-phrase', phrase);
  adjustWindowSize(phrase);
}

function adjustWindowSize(text) {
  const fontSize = 24;
  const padding = 20;
  const verticalPadding = 100; // 50px top + 50px bottom
  const width = (text.length * fontSize * 0.6) + padding;
  const height = fontSize + verticalPadding;
  mainWindow.setSize(Math.ceil(width), Math.ceil(height));
}

function handleKeyPress(event) {
  if (event.shiftKey && event.key === 'ArrowRight') {
    currentIndex = (currentIndex + 1) % phrases.length;
    displayPhrase(currentIndex);
  } else if (event.shiftKey && event.key === 'ArrowLeft') {
    currentIndex = (currentIndex - 1 + phrases.length) % phrases.length;
    displayPhrase(currentIndex);
  }
}

function cyclePhrases() {
  currentIndex = (currentIndex + 1) % phrases.length;
  displayPhrase(currentIndex);
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

ipcMain.on('key-press', (event, keyEvent) => {
  handleKeyPress(keyEvent);
});
