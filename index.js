const { app, BrowserWindow, Menu, Tray, ipcMain, dialog, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { createAboutWindow } = require('./about');

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

const MODES = {
  MENU_BAR: 'Menu Bar',
  WINDOW: 'Window'
}

let WORDS_CHANGE_INTERVAL_IN_MS = 5000;

let mainWindow;
let tray;
let phrases = [];
let currentIndex = 0;
let intervalId;
let currentLanguage = 'de';
let currentFromLanguage = 'en';
let currentLevel = 'A1';
let currentMode = MODES.WINDOW;
let currentLanguagePath = getLanguageFilePath(currentLanguage, currentFromLanguage, currentLevel);

function getLanguageFilePath(language, fromLanguage, level) {
  const basePath = process.env.NODE_ENV === 'development' ? __dirname : process.resourcesPath;
  return path.join(basePath, 'languages', language, fromLanguage, `${level.toLowerCase()}.json`);
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
      },
      skipTaskbar: true,
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
        label: 'Background',
        submenu: [
          {
            label: 'Light',
            type: 'radio',
            checked: true,
            click: () => {
              mainWindow.webContents.send('set-background', 'light');
            }
          },
          {
            label: 'Dark',
            type: 'radio',
            click: () => {
              mainWindow.webContents.send('set-background', 'dark');
            }
          }
        ]
      },
      {
        label: 'Language',
        submenu: createLanguageSubmenu()
      },
      {
        label: 'Mode',
        submenu: [
          {
            label: 'Window',
            type: 'radio',
            checked: true,
            click: () => {
              switchMode('Window');
            }
          },
          {
            label: 'Menu Bar',
            type: 'radio',
            click: () => {
              switchMode('Menu Bar');
            }
          }
        ]
      },
      {
        label: 'Changing speed',
        submenu: createWordSpeedChangingSubMenu()
      },
      {
        label: 'About',
        click: () => {
          createAboutWindow();
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

function createLanguageSubmenu() {
  const languages = ['en', 'de', 'fr'];
  const fromLanguages = {
    en: ['ru', 'de', 'fr'],
    de: ['ru', 'en'],
    fr: ['en']
  };

  return languages.map(language => ({
    label: language.toUpperCase(),
    submenu: fromLanguages[language].map(fromLang => ({
      label: `${fromLang.toUpperCase()} -> ${language.toUpperCase()}`,
      submenu: createLevelSubmenu(language, fromLang)
    }))
  }));
}

function createLevelSubmenu(languageTo, languageFrom) {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
  if (process.env.NODE_ENV === 'development') {
    levels.push('custom')
  }
  return levels.map(level => ({
    label: `Level ${level}`,
    type: 'radio',
    click: () => {
      switchLanguage(languageTo, languageFrom, level);
    }
  }));
}

function createWordSpeedChangingSubMenu() {
  const intervals = [
    { label: '5 seconds', value: 5000 },
    { label: '10 seconds', value: 10000 },
    { label: '15 seconds', value: 15000 },
    { label: '20 seconds', value: 20000 }
  ];

  return intervals.map(interval => ({
    label: interval.label,
    type: 'radio',
    checked: interval.value === WORDS_CHANGE_INTERVAL_IN_MS,
    click: () => {
      switchInterval(interval.value);
    }
  }));
}

function switchLanguage(language, fromLanguage, level) {
  try {
    currentLanguage = language;
    currentFromLanguage = fromLanguage;
    currentLevel = level;
    currentLanguagePath = getLanguageFilePath(currentLanguage, currentFromLanguage, currentLevel);
    loadPhrases(currentLanguagePath);
  } catch (error) {
    showError('Failed to switch language.', error);
  }
}

function switchMode(mode) {
  try {
    currentMode = mode;
    if (mode === MODES.WINDOW) {
      if (!mainWindow) {
        createWindow();
      } else {
        mainWindow.show();
      }
      tray.setTitle('Vocabularify');
    } else if (mode === MODES.MENU_BAR) {
      if (mainWindow) {
        mainWindow.hide();
      }
      displayPhraseInTray(currentIndex);
    }
    registerGlobalShortcuts();
  } catch (error) {
    showError('Failed to switch mode.', error);
  }
}

function switchInterval(interval) {
  try {
    WORDS_CHANGE_INTERVAL_IN_MS = interval;
    clearInterval(intervalId);
    intervalId = setInterval(cyclePhrases, WORDS_CHANGE_INTERVAL_IN_MS);
  } catch (error) {
    showError('Failed to switch interval.', error);
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
        intervalId = setInterval(cyclePhrases, WORDS_CHANGE_INTERVAL_IN_MS);
      }
    });
  } catch (error) {
    showError('Failed to read phrases file.', error);
  }
}

function displayPhrase(index) {
  try {
    const phrase = phrases[index];
    if (currentMode === 'Window') {
      mainWindow.webContents.send('display-phrase', phrase);
      adjustWindowSize(phrase);
    } else if (currentMode === 'Menu Bar') {
      displayPhraseInTray(index);
    }
  } catch (error) {
    showError('Failed to display phrase.', error);
  }
}

function displayPhraseInTray(index) {
  try {
    const phrase = phrases[index];
    tray.setTitle(phrase);
  } catch (error) {
    showError('Failed to display phrase in tray.', error);
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

function registerGlobalShortcuts() {
  globalShortcut.unregisterAll();
  if (currentMode === 'Menu Bar') {
    globalShortcut.register('Shift+Right', () => {
      currentIndex = (currentIndex + 1) % phrases.length;
      displayPhrase(currentIndex);
    });

    globalShortcut.register('Shift+Left', () => {
      currentIndex = (currentIndex - 1 + phrases.length) % phrases.length;
      displayPhrase(currentIndex);
    });
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
  registerGlobalShortcuts();

  // Hide the dock icon on macOS
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0 && currentMode === 'Window') createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
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
