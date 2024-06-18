const { app, BrowserWindow, Menu, Tray, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Conditionally include electron-reload in development mode
if (process.env.NODE_ENV === 'development') {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
    });
  } catch (error) {
    console.error('Error loading electron-reload:', error);
  }
}

let mainWindow;
let tray;
let phrases = [];
let currentIndex = 0;
let intervalId;
let currentLanguage = 'de';
let currentLevel = 'A1';
let currentLanguagePath = getLanguageFilePath(currentLanguage, currentLevel);

function getLanguageFilePath(language, level) {
  const basePath = process.env.NODE_ENV === 'development' ? __dirname : process.resourcesPath;
  return path.join(basePath, 'languages', language, `${level.toLowerCase()}.json`);
}

function createWindow() {
  try {
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

    mainWindow.on('close', () => {
      app.quit();
    });

    mainWindow.webContents.on('did-finish-load', () => {
      loadPhrases(currentLanguagePath);
    });
  } catch (error) {
    showError('Failed to create the main window.', error);
  }
}

function createTray() {
  try {
    tray = new Tray(path.join(__dirname, 'context_menu_icon.png'));
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
            submenu: createLevelSubmenu('de')
          },
          {
            label: 'English -> French',
            submenu: createLevelSubmenu('fr')
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
  } catch (error) {
    showError('Failed to create the tray.', error);
  }
}

function createLevelSubmenu(languageTo) {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
  return levels.map(level => ({
    label: `Level ${level}`,
    type: 'radio',
    click: () => {
      switchLanguage(languageTo, level);
    }
  }));
}

function switchLanguage(language, level) {
  try {
    currentLanguage = language;
    currentLevel = level;
    currentLanguagePath = getLanguageFilePath(currentLanguage, currentLevel);
    loadPhrases(currentLanguagePath);
  } catch (error) {
    showError('Failed to switch language.', error);
  }
}

function loadPhrases(filePath) {
  try {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        showError('Failed to load phrases.', err);
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
  } catch (error) {
    showError('Failed to read phrases file.', error);
  }
}

function displayPhrase(index) {
  try {
    const phrase = phrases[index];
    mainWindow.webContents.send('display-phrase', phrase);
    adjustWindowSize(phrase);
  } catch (error) {
    showError('Failed to display phrase.', error);
  }
}

function adjustWindowSize(text) {
  try {
    const fontSize = 24;
    const padding = 20;
    const verticalPadding = 100; // 50px top + 50px bottom
    const width = (text.length * fontSize * 0.6) + padding;
    const height = fontSize + verticalPadding;
    mainWindow.setSize(Math.ceil(width), Math.ceil(height));
  } catch (error) {
    showError('Failed to adjust window size.', error);
  }
}

function handleKeyPress(event) {
  try {
    if (event.shiftKey && event.key === 'ArrowRight') {
      currentIndex = (currentIndex + 1) % phrases.length;
      displayPhrase(currentIndex);
    } else if (event.shiftKey && event.key === 'ArrowLeft') {
      currentIndex = (currentIndex - 1 + phrases.length) % phrases.length;
      displayPhrase(currentIndex);
    }
  } catch (error) {
    showError('Failed to handle key press.', error);
  }
}

function cyclePhrases() {
  try {
    currentIndex = (currentIndex + 1) % phrases.length;
    displayPhrase(currentIndex);
  } catch (error) {
    showError('Failed to cycle phrases.', error);
  }
}

function showError(message, error) {
  dialog.showErrorBox(message, error ? error.stack || error.toString() : 'Unknown error');
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
  try {
    if (mainWindow) {
      mainWindow.setSize(width, height);
    }
  } catch (error) {
    showError('Failed to resize window.', error);
  }
});

ipcMain.on('key-press', (event, keyEvent) => {
  handleKeyPress(keyEvent);
});
