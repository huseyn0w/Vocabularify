const { app, BrowserWindow, dialog, globalShortcut, shell } = require('electron');

const { MODES, IPC, LEVELS, SPEED_INTERVALS, CUSTOM_LEVEL_PREFIX, LANGUAGE_META } = require('./src/shared/constants');
const { getLanguageFilePath, getLocale } = require('./src/shared/languagePaths');
const { CUSTOM_DICTS_PATH, getDictionariesBasePath, ensureCustomDictsDir, listAvailablePairs } = require('./src/main/config');
const { clampInterval } = require('./src/shared/state');
const { loadState, saveState } = require('./src/main/store');
const dictionaries = require('./src/main/dictionaries');
const { createPhraseEngine } = require('./src/main/phraseEngine');
const { createMainWindow, createImportWindow, createSettingsWindow, createAboutWindow } = require('./src/main/windows');
const { createTrayController } = require('./src/main/tray');
const { registerIpcHandlers } = require('./src/main/ipc');

let state = loadState();
let mainWindow = null;
let engine;
let tray;
let isHoverPaused = false;

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

function setLevel(level) {
  switchLanguage(state.currentLanguage, state.currentFromLanguage, level);
}

// Called from the language settings window. Switches the pair, keeping a
// standard CEFR level (custom levels are pair-specific, so reset to A1).
function setLanguagePair({ to, from }) {
  const level = String(state.currentLevel).startsWith(CUSTOM_LEVEL_PREFIX) ? 'A1' : state.currentLevel;
  switchLanguage(to, from, level);
}

// Full snapshot consumed by the Settings window.
function getSettings() {
  return {
    languages: { meta: LANGUAGE_META, pairs: listAvailablePairs() },
    levels: LEVELS,
    customLevels: dictionaries.listCustomDictionaryNamesFor(state.currentLanguage, state.currentFromLanguage),
    speeds: SPEED_INTERVALS,
    isMac: process.platform === 'darwin',
    modes: [MODES.WINDOW, MODES.MENU_BAR, MODES.CHECKUP],
    current: {
      to: state.currentLanguage,
      from: state.currentFromLanguage,
      level: state.currentLevel,
      background: state.currentBackground,
      mode: state.currentMode,
      sound: state.isSoundMode,
      intervalMs: state.intervalMs
    }
  };
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
  // Don't resume auto-advance if the pointer is still hovering the window.
  if (!isHoverPaused) {
    engine.restartTimer();
  }
}

// Pauses auto-advance while the window is hovered; the current word stays put.
function setHoverPaused(paused) {
  isHoverPaused = paused;
  if (paused) {
    engine.stop();
  } else {
    engine.restartTimer();
  }
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

// Parent dialogs to the main window only when it is actually visible; a
// child of a hidden window (Menu Bar mode) may not display. When hidden,
// returning undefined makes the dialog a normal top-level window.
function dialogParent() {
  return mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible() ? mainWindow : undefined;
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
    actions: {
      openSettings: () => createSettingsWindow({ parent: dialogParent() }),
      openAbout: () => createAboutWindow({ parent: dialogParent() }),
      quit: quitApp
    }
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
    openImport: () => createImportWindow({ parent: dialogParent() }),
    onKeyPress: handleKeyPress,
    onSetPaused: setHoverPaused,
    getSettings,
    setLanguagePair,
    setLevel,
    setBackground,
    setMode: switchMode,
    setSound: toggleSound,
    setSpeed: ms => setSpeed(clampInterval(ms))
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
