const { app, BrowserWindow, dialog, globalShortcut, shell } = require('electron');

const { MODES, IPC } = require('./src/shared/constants');
const { getLanguageFilePath, parseCustomDictName, getLocale } = require('./src/shared/languagePaths');
const { CUSTOM_DICTS_PATH, getDictionariesBasePath, ensureCustomDictsDir } = require('./src/main/config');
const { loadState, saveState } = require('./src/main/store');
const dictionaries = require('./src/main/dictionaries');
const { createPhraseEngine } = require('./src/main/phraseEngine');
const { createMainWindow, createImportWindow, createAboutWindow } = require('./src/main/windows');
const { createTrayController } = require('./src/main/tray');
const { registerIpcHandlers } = require('./src/main/ipc');

let state = loadState();
let mainWindow = null;
let engine;
let tray;

function showError(message, error) {
  dialog.showErrorBox(message, error ? error.stack || error.toString() : 'Unknown error');
}

// Sends to the main window only when it is alive. Guards against the
// teardown race where the auto-advance timer fires after the window has
// been destroyed (closing the window quits the app).
function sendToWindow(channel, ...args) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args);
  }
}

// --- Phrase rendering -------------------------------------------------------

// Routes the current phrase to whichever surface the active mode uses:
// the tray title in Menu Bar mode, the window otherwise.
function renderPhrase(phrase, index, total) {
  state.currentIndex = index;
  if (state.currentMode === MODES.MENU_BAR) {
    tray.setTitle(phrase);
  } else {
    sendToWindow(IPC.DISPLAY_PHRASE, phrase, state.currentMode, index, total);
  }
}

function currentDictionaryPath() {
  return getLanguageFilePath({
    basePath: getDictionariesBasePath(),
    customDictsPath: CUSTOM_DICTS_PATH,
    language: state.currentLanguage,
    fromLanguage: state.currentFromLanguage,
    level: state.currentLevel
  });
}

function loadCurrentDictionary(startIndex) {
  try {
    engine.load(currentDictionaryPath(), startIndex);
  } catch (error) {
    showError('Failed to load phrases.', error);
  }
}

// --- Tray actions -----------------------------------------------------------

function setBackground(background) {
  state.currentBackground = background;
  sendToWindow(IPC.SET_BACKGROUND, background);
  tray.refresh();
}

function switchLanguage(language, fromLanguage, level) {
  state.currentLanguage = language;
  state.currentFromLanguage = fromLanguage;
  state.currentLevel = level;
  loadCurrentDictionary(0); // restart from the first word of the new dictionary
  sendToWindow(IPC.SET_LANGUAGES, getLocale(fromLanguage), getLocale(language));
  tray.refresh();
}

function switchMode(mode) {
  state.currentMode = mode;
  if (mode === MODES.WINDOW || mode === MODES.CHECKUP) {
    if (!mainWindow) {
      createWiredMainWindow();
    } else {
      mainWindow.show();
    }
    tray.setTitle('Vocabularify');
  } else if (mode === MODES.MENU_BAR && mainWindow) {
    mainWindow.hide();
  }
  engine.render();
  registerGlobalShortcuts();
  tray.refresh();
}

function setSpeed(intervalMs) {
  state.intervalMs = intervalMs;
  engine.setIntervalMs(intervalMs);
  tray.refresh();
}

function toggleSound(enabled) {
  state.isSoundMode = enabled;
  sendToWindow(IPC.TOGGLE_SOUND_MODE, enabled);
}

function deleteDictionaryAction(baseName) {
  const result = dictionaries.deleteDictionary(baseName);
  if (result.success) {
    const parsed = parseCustomDictName(baseName);
    const isActive = parsed
      && state.currentLanguage === parsed.language
      && state.currentFromLanguage === parsed.fromLanguage
      && state.currentLevel === `custom:${parsed.name}`;
    if (isActive) {
      switchLanguage(state.currentLanguage, state.currentFromLanguage, 'A1');
    }
    dialog.showMessageBoxSync({
      type: 'info',
      title: 'Success',
      message: `Dictionary ${result.dictionaryName} deleted successfully.`
    });
  } else {
    dialog.showErrorBox('Error', `Failed to delete dictionary: ${result.error}`);
  }
  tray.refresh();
}

// --- Input ------------------------------------------------------------------

function handleKeyPress(keyEvent) {
  if (!keyEvent.shiftKey || (keyEvent.key !== 'ArrowRight' && keyEvent.key !== 'ArrowLeft')) {
    return;
  }
  sendToWindow(IPC.CLEAR_TIMEOUTS);
  if (keyEvent.key === 'ArrowRight') {
    engine.next();
  } else {
    engine.previous();
  }
  engine.restartTimer();
}

function registerGlobalShortcuts() {
  globalShortcut.unregisterAll();
  if (state.currentMode === MODES.MENU_BAR) {
    globalShortcut.register('Shift+Right', () => engine.next());
    globalShortcut.register('Shift+Left', () => engine.previous());
  }
}

// --- Persistence ------------------------------------------------------------

function persist() {
  state.currentIndex = engine.getIndex();
  saveState(state);
}

function quitApp() {
  persist();
  app.quit();
}

// --- Window wiring ----------------------------------------------------------

function createWiredMainWindow() {
  mainWindow = createMainWindow({
    onClose: () => {
      engine.stop(); // halt the timer before the window is destroyed
      app.quit();
    },
    onReady: win => {
      win.webContents.send(IPC.SET_LANGUAGES, getLocale(state.currentFromLanguage), getLocale(state.currentLanguage));
      win.webContents.send(IPC.SET_BACKGROUND, state.currentBackground);
      loadCurrentDictionary(state.currentIndex);
      if (state.currentMode === MODES.MENU_BAR) {
        win.hide();
      }
    }
  });
  return mainWindow;
}

// --- App lifecycle ----------------------------------------------------------

app.whenReady().then(() => {
  ensureCustomDictsDir();

  engine = createPhraseEngine({ intervalMs: state.intervalMs, onRender: renderPhrase });

  tray = createTrayController({
    getState: () => state,
    actions: {
      setBackground,
      switchLanguage,
      switchMode,
      setSpeed,
      toggleSound,
      openImport: () => createImportWindow(),
      openAbout: () => createAboutWindow(),
      deleteDictionary: deleteDictionaryAction,
      quit: quitApp
    },
    dictionaries
  });
  tray.create();

  registerIpcHandlers({
    importDictionary: payload => {
      const result = dictionaries.importDictionary(payload);
      tray.refresh();
      return result;
    },
    chooseDictionaryFile: async () => {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Select Dictionary File',
        properties: ['openFile'],
        filters: [{ name: 'Text', extensions: ['txt'] }]
      });
      return canceled ? null : filePaths[0];
    },
    openExternal: url => {
      // Only ever hand http(s) URLs to the OS to avoid opening arbitrary
      // schemes (file:, etc.) from renderer-supplied input.
      if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
        shell.openExternal(url);
      }
    },
    onKeyPress: handleKeyPress
  });

  createWiredMainWindow();
  registerGlobalShortcuts();

  if (process.platform === 'darwin') {
    app.dock.hide();
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }
  mainWindow.setAlwaysOnTop(true, 'screen-saver');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && (state.currentMode === MODES.WINDOW || state.currentMode === MODES.CHECKUP)) {
      createWiredMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  engine.stop();
  persist();
});
