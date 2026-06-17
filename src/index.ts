import { app, BrowserWindow, dialog, globalShortcut, shell } from 'electron';

import { MODES, IPC, LEVELS, SPEED_INTERVALS, CUSTOM_LEVEL_PREFIX, LANGUAGE_META } from './shared/constants';
import { getLanguageFilePath, getLocale } from './shared/languagePaths';
import { CUSTOM_DICTS_PATH, getDictionariesBasePath, ensureCustomDictsDir, listAvailablePairs } from './main/config';
import { clampInterval } from './shared/state';
import { loadState, saveState } from './main/store';
import * as dictionaries from './main/dictionaries';
import { createPhraseEngine } from './main/phraseEngine';
import { createMainWindow, createImportWindow, createSettingsWindow, createAboutWindow } from './main/windows';
import { createTrayController } from './main/tray';
import { registerIpcHandlers } from './main/ipc';
import type { AppState, PhraseEngine, TrayController, KeyEvent, LanguagePair, Background, SettingsSnapshot, ImportPayload } from './shared/types';

let state: AppState = loadState();
let mainWindow: BrowserWindow | null = null;
let engine: PhraseEngine;
let tray: TrayController;
let isHoverPaused = false;

function showError(message: string, error?: unknown) {
  dialog.showErrorBox(message, error ? (error instanceof Error ? error.stack ?? error.toString() : String(error)) : 'Unknown error');
}

// Sends to the main window only when it is alive. Guards against the
// teardown race where the auto-advance timer fires after the window has
// been destroyed (closing the window quits the app).
function sendToWindow(channel: string, ...args: unknown[]) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args);
  }
}

// --- Phrase rendering -------------------------------------------------------

// Routes the current phrase to whichever surface the active mode uses:
// the tray title in Menu Bar mode, the window otherwise.
function renderPhrase(phrase: string, index: number, total: number) {
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

function loadCurrentDictionary(startIndex: number) {
  try {
    engine.load(currentDictionaryPath(), startIndex);
  } catch (error) {
    showError('Failed to load phrases.', error);
  }
}

// --- Tray actions -----------------------------------------------------------

function setBackground(background: Background) {
  state.currentBackground = background;
  sendToWindow(IPC.SET_BACKGROUND, background);
  tray.refresh();
}

function switchLanguage(language: string, fromLanguage: string, level: string) {
  state.currentLanguage = language;
  state.currentFromLanguage = fromLanguage;
  state.currentLevel = level;
  loadCurrentDictionary(0); // restart from the first word of the new dictionary
  sendToWindow(IPC.SET_LANGUAGES, getLocale(fromLanguage), getLocale(language));
  tray.refresh();
}

function switchMode(mode: AppState['currentMode']) {
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

function setSpeed(intervalMs: number) {
  state.intervalMs = intervalMs;
  engine.setIntervalMs(intervalMs);
  tray.refresh();
}

function toggleSound(enabled: boolean) {
  state.isSoundMode = enabled;
  sendToWindow(IPC.TOGGLE_SOUND_MODE, enabled);
}

function setLevel(level: string) {
  switchLanguage(state.currentLanguage, state.currentFromLanguage, level);
}

// Called from the language settings window. Switches the pair, keeping a
// standard CEFR level (custom levels are pair-specific, so reset to A1).
function setLanguagePair({ to, from }: LanguagePair) {
  const level = String(state.currentLevel).startsWith(CUSTOM_LEVEL_PREFIX) ? 'A1' : state.currentLevel;
  switchLanguage(to, from, level);
}

// Full snapshot consumed by the Settings window.
function getSettings(): SettingsSnapshot {
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

function handleKeyPress(keyEvent: KeyEvent) {
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
function setHoverPaused(paused: boolean) {
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
function dialogParent(): BrowserWindow | undefined {
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
    importDictionary: (payload: ImportPayload) => {
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
    app.dock?.hide();
    mainWindow!.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }
  mainWindow!.setAlwaysOnTop(true, 'screen-saver');

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
