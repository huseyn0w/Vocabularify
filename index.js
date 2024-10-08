const { app, BrowserWindow, Menu, Tray, ipcMain, dialog, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { createAboutWindow } = require('./about');
const { handleImportDictionary, handleDeleteDictionary } = require('./dictionary-import');

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');
const CUSTOM_DICTS_PATH = path.join(app.getPath('userData'), 'custom_dictionaries');

if (!fs.existsSync(CUSTOM_DICTS_PATH)) {
  fs.mkdirSync(CUSTOM_DICTS_PATH);
}

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
  WINDOW: 'Window',
  SOUND: 'Sound',
  CHECKUP: 'Checkup'
};

const MIN_WINDOW_WIDTH = 400; // Set minimum window width
const MIN_WINDOW_HEIGHT = 200; // Set minimum window height

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
let isSoundMode = false;

function getLanguageFilePath(language, fromLanguage, level) {
  const basePath = process.env.NODE_ENV === 'development' ? __dirname : process.resourcesPath;
  if (level.startsWith('custom:')) {
    return path.join(CUSTOM_DICTS_PATH, `${language}_${fromLanguage}_${level.split(':')[1]}.json`);
  }
  return path.join(basePath, 'languages', language, fromLanguage, `${level.toLowerCase()}.json`);
}

function saveState() {
  const state = {
    currentIndex,
    currentLanguage,
    currentFromLanguage,
    currentLevel,
    currentMode,
    isSoundMode,
    WORDS_CHANGE_INTERVAL_IN_MS
  };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(state));
}

function loadState() {
  if (fs.existsSync(CONFIG_PATH)) {
    const state = JSON.parse(fs.readFileSync(CONFIG_PATH));
    currentIndex = state.currentIndex || 0;
    currentLanguage = state.currentLanguage || 'de';
    currentFromLanguage = state.currentFromLanguage || 'en';
    currentLevel = state.currentLevel || 'A1';
    currentMode = state.currentMode || MODES.WINDOW;
    isSoundMode = state.isSoundMode || false;
    WORDS_CHANGE_INTERVAL_IN_MS = state.WORDS_CHANGE_INTERVAL_IN_MS || 5000;
    currentLanguagePath = getLanguageFilePath(currentLanguage, currentFromLanguage, currentLevel);
  }
}

function createWindow() {
  try {
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      minWidth: MIN_WINDOW_WIDTH,
      minHeight: MIN_WINDOW_HEIGHT,
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
      ...(process.platform === 'darwin' ? [
        {
          label: 'Mode',
          submenu: [
            {
              label: 'Window',
              type: 'radio',
              checked: currentMode === MODES.WINDOW,
              click: () => {
                switchMode(MODES.WINDOW);
              }
            },
            {
              label: 'Menu Bar',
              type: 'radio',
              checked: currentMode === MODES.MENU_BAR,
              click: () => {
                switchMode(MODES.MENU_BAR);
              }
            },
            {
              label: 'Checkup',
              type: 'radio',
              checked: currentMode === MODES.CHECKUP,
              click: () => {
                switchMode(MODES.CHECKUP);
              }
            }
          ]
        }
      ] : []),
      {
        label: 'Sound',
        type: 'checkbox',
        checked: isSoundMode,
        click: (menuItem) => {
          isSoundMode = menuItem.checked;
          mainWindow.webContents.send('toggle-sound-mode', isSoundMode);
        }
      },
      {
        label: 'Changing speed',
        submenu: createWordSpeedChangingSubMenu()
      },
      {
        label: 'Import Dictionary',
        click: () => {
          createImportWindow();
        }
      },
      {
        label: 'Delete Dictionary',
        submenu: createDeleteDictionarySubmenu()
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
          saveState();
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
  const customDictionaries = fs.readdirSync(CUSTOM_DICTS_PATH)
    .filter(file => file.endsWith('.json') && file.startsWith(`${languageTo}_${languageFrom}_`))
    .map(file => path.basename(file, '.json').replace(`${languageTo}_${languageFrom}_`, ''));
  
  return [
    ...levels.map(level => ({
      label: `Level ${level}`,
      type: 'radio',
      checked: currentLevel === level,
      click: () => {
        switchLanguage(languageTo, languageFrom, level);
      }
    })),
    ...customDictionaries.map(dict => ({
      label: `Custom: ${dict}`,
      type: 'radio',
      checked: currentLevel === `custom:${dict}`,
      click: () => {
        switchLanguage(languageTo, languageFrom, `custom:${dict}`);
      }
    }))
  ];
}

function createDeleteDictionarySubmenu() {
  const customDictionaries = fs.readdirSync(CUSTOM_DICTS_PATH)
    .filter(file => file.endsWith('.json'))
    .map(file => path.basename(file, '.json'));
  
  return customDictionaries.map(dict => ({
    label: dict,
    click: async () => {
      const result = await handleDeleteDictionary(null, dict);
      if (result.success) {
        if (currentLevel === `custom:${dict.split('_').slice(2).join('_')}`) {
          switchLanguage(currentLanguage, currentFromLanguage, 'A1');
        }
        dialog.showMessageBoxSync({
          type: 'info',
          title: 'Success',
          message: `Dictionary ${result.dictionaryName} deleted successfully. Switching back to A1 level`
        });
      } else {
        dialog.showErrorBox('Error', `Failed to delete dictionary: ${result.error}`);
      }
      updateTrayMenu();
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
    currentIndex = 0; // Reset the word index to start from the first word
    currentLanguagePath = getLanguageFilePath(currentLanguage, currentFromLanguage, currentLevel);
    loadPhrases(currentLanguagePath);
    mainWindow.webContents.send('set-languages', getLanguageCode(currentFromLanguage), getLanguageCode(currentLanguage));
    updateTrayMenu(); // Update the tray menu to reflect the new state
  } catch (error) {
    showError('Failed to switch language.', error);
  }
}

function getLanguageCode(lang) {
  const languageMap = {
    en: 'en-US',
    de: 'de-DE',
    fr: 'fr-FR',
    ru: 'ru-RU'
  };
  return languageMap[lang] || 'en-US';
}

function switchMode(mode) {
  try {
    currentMode = mode;
    if (mode === MODES.WINDOW || mode === MODES.CHECKUP) {
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
        currentIndex = Math.min(currentIndex, phrases.length - 1); // Ensure currentIndex is valid
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
    mainWindow.webContents.send('display-phrase', phrase, currentMode, currentIndex, phrases.length);
    adjustWindowSize(phrase);
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
    const width = Math.max((text.length * fontSize * 0.6) + padding, MIN_WINDOW_WIDTH);
    const height = Math.max(fontSize + verticalPadding, MIN_WINDOW_HEIGHT);
    mainWindow.setSize(Math.ceil(width), Math.ceil(height));
  } catch (error) {
    showError('Failed to adjust window size.', error);
  }
}

function handleKeyPress(event) {
  try {
    if (event.shiftKey && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
      clearInterval(intervalId);
      if (event.key === 'ArrowRight') {
        currentIndex = (currentIndex + 1) % phrases.length;
      } else if (event.key === 'ArrowLeft') {
        currentIndex = (currentIndex - 1 + phrases.length) % phrases.length;
      }
      mainWindow.webContents.send('clear-timeouts');  // Ensure renderer clears any existing timeouts
      displayPhrase(currentIndex);
      intervalId = setInterval(cyclePhrases, WORDS_CHANGE_INTERVAL_IN_MS);
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

function updateTrayMenu() {
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
    ...(process.platform === 'darwin' ? [
      {
        label: 'Mode',
        submenu: [
          {
            label: 'Window',
            type: 'radio',
            checked: currentMode === MODES.WINDOW,
            click: () => {
              switchMode(MODES.WINDOW);
            }
          },
          {
            label: 'Menu Bar',
            type: 'radio',
            checked: currentMode === MODES.MENU_BAR,
            click: () => {
              switchMode(MODES.MENU_BAR);
            }
          },
          {
            label: 'Checkup',
            type: 'radio',
            checked: currentMode === MODES.CHECKUP,
            click: () => {
              switchMode(MODES.CHECKUP);
            }
          }
        ]
      }
    ] : []),
    {
      label: 'Sound',
      type: 'checkbox',
      checked: isSoundMode,
      click: (menuItem) => {
        isSoundMode = menuItem.checked;
        mainWindow.webContents.send('toggle-sound-mode', isSoundMode);
      }
    },
    {
      label: 'Changing speed',
      submenu: createWordSpeedChangingSubMenu()
    },
    {
      label: 'Import Dictionary',
      click: () => {
        createImportWindow();
      }
    },
    {
      label: 'Delete Dictionary',
      submenu: createDeleteDictionarySubmenu()
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
        saveState();
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function createImportWindow() {
  const importWindow = new BrowserWindow({
    width: 500,
    height: 400,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  importWindow.loadFile('import.html');
}

app.whenReady().then(() => {
  loadState();
  createWindow();
  createTray();
  registerGlobalShortcuts();

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('set-languages', getLanguageCode(currentFromLanguage), getLanguageCode(currentLanguage));
  });

  if (process.platform === 'darwin') {
    app.dock.hide();
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
  } else {
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0 && (currentMode === 'Window' || currentMode === 'Checkup')) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  saveState();
});

ipcMain.handle('import-dictionary', async (event, ...args) => {
  const result = await handleImportDictionary(event, ...args);
  updateTrayMenu();
  return result;
});

ipcMain.handle('delete-dictionary', async (event, ...args) => {
  const result = await handleDeleteDictionary(event, ...args);
  updateTrayMenu();
  return result;
});

ipcMain.on('key-press', (event, keyEvent) => {
  handleKeyPress(keyEvent);
});
